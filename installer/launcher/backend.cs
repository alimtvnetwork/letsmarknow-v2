using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace LetsMarkNowBackendLauncher
{
    static class Program
    {
        private const string HealthCheckUrl = "http://127.0.0.1:3000/v1/health";

        [STAThread]
        static int Main(string[] args)
        {
            try
            {
                bool stopRequested = false;
                bool statusRequested = false;

                foreach (string arg in args)
                {
                    if (string.Equals(arg, "--stop", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(arg, "-k", StringComparison.OrdinalIgnoreCase))
                    {
                        stopRequested = true;
                    }
                    else if (string.Equals(arg, "--status", StringComparison.OrdinalIgnoreCase))
                    {
                        statusRequested = true;
                    }
                }

                if (stopRequested)
                {
                    StopBackendProcesses();
                    return 0;
                }

                if (statusRequested)
                {
                    bool healthy = IsBackendHealthy(HealthCheckUrl);
                    Console.WriteLine(healthy ? "HEALTHY" : "OFFLINE");
                    return healthy ? 0 : 1;
                }

                // If already running and healthy, exit immediately
                if (IsBackendHealthy(HealthCheckUrl))
                {
                    return 0;
                }

                string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                string backendDir = LocateBackendDirectory(baseDir);
                if (string.IsNullOrEmpty(backendDir))
                {
                    return 1;
                }

                string nodeExe = LocateNodeExecutable(backendDir, baseDir);
                if (string.IsNullOrEmpty(nodeExe))
                {
                    return 2;
                }

                string serverJs = LocateServerJs(backendDir);
                if (string.IsNullOrEmpty(serverJs))
                {
                    return 3;
                }

                // Ensure data directory exists
                string dataDir = Path.Combine(backendDir, "data");
                if (!Directory.Exists(dataDir))
                {
                    try { Directory.CreateDirectory(dataDir); } catch { }
                }

                string logPath = Path.Combine(backendDir, "backend.log");

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = nodeExe,
                    Arguments = "\"" + serverJs + "\"",
                    WorkingDirectory = backendDir,
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                Process proc = Process.Start(psi);
                if (proc == null)
                {
                    return 4;
                }

                // Wait up to 25 seconds for health check to succeed
                for (int i = 0; i < 100; i++)
                {
                    Thread.Sleep(250);
                    if (IsBackendHealthy(HealthCheckUrl))
                    {
                        return 0;
                    }

                    if (proc.HasExited)
                    {
                        return 5;
                    }
                }

                return 0;
            }
            catch (Exception ex)
            {
                try
                {
                    string errLog = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "backend-launcher-error.log");
                    File.AppendAllText(errLog, DateTime.Now.ToString("s") + " " + ex.ToString() + Environment.NewLine);
                }
                catch { }
                return 99;
            }
        }

        public static bool IsBackendHealthy(string url)
        {
            if (CheckHealthUrl("http://127.0.0.1:3000/v1/health")) return true;
            if (CheckHealthUrl("http://localhost:3000/v1/health")) return true;
            return false;
        }

        private static bool CheckHealthUrl(string testUrl)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(testUrl);
                request.Timeout = 800;
                request.Method = "GET";
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    return response.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static string LocateBackendDirectory(string baseDir)
        {
            // If baseDir itself has dist\server.js
            if (File.Exists(Path.Combine(baseDir, @"dist\server.js")) || File.Exists(Path.Combine(baseDir, "server.js")))
            {
                return baseDir;
            }

            // If baseDir has a backend folder
            string candidate = Path.Combine(baseDir, "backend");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            // If baseDir is bin/ and repo has backend/
            candidate = Path.Combine(baseDir, @"..\backend");
            if (Directory.Exists(candidate))
            {
                return Path.GetFullPath(candidate);
            }

            // LocalAppData install dir fallback
            candidate = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"LetsMarkNow\backend");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            return null;
        }

        private static string LocateServerJs(string backendDir)
        {
            string[] paths = new string[]
            {
                Path.Combine(backendDir, @"dist\server.js"),
                Path.Combine(backendDir, "server.js")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p))
                {
                    return p;
                }
            }

            return null;
        }

        private static string LocateNodeExecutable(string backendDir, string baseDir)
        {
            string[] candidates = new string[]
            {
                Path.Combine(backendDir, "node.exe"),
                Path.Combine(baseDir, "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"LetsMarkNow\backend\node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"nodejs\node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"nodejs\node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\node\node.exe")
            };

            foreach (string c in candidates)
            {
                if (File.Exists(c))
                {
                    return c;
                }
            }

            // Search PATH
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                string[] dirs = pathEnv.Split(';');
                foreach (string d in dirs)
                {
                    try
                    {
                        string test = Path.Combine(d.Trim(), "node.exe");
                        if (File.Exists(test))
                        {
                            return test;
                        }
                    }
                    catch { }
                }
            }

            return null;
        }

        private static void StopBackendProcesses()
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c for /f \"tokens=5\" %a in ('netstat -aon ^| findstr \":3000\" ^| findstr \"LISTENING\"') do taskkill /f /pid %a",
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                using (Process p = Process.Start(psi))
                {
                    if (p != null) p.WaitForExit(3000);
                }
            }
            catch { }
        }
    }
}
