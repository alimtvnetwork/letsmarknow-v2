using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace LetsMarkNowLauncher
{
    static class Program
    {
        private const string StaticExtensionId = "pnfhjpjocddcolcnlginjoblglphhgpm";
        private const string HealthCheckUrl = "http://localhost:3000/v1/health";

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

                // 1. Ensure backend service is running before browser launch
                EnsureBackendRunning(baseDir);

                // 2. Locate extension directory
                string extensionDir = Path.Combine(baseDir, "extension");

                // In case running from bin/ or repo during development
                if (!Directory.Exists(extensionDir))
                {
                    string candidate = Path.Combine(baseDir, @"..\dist\extension");
                    if (Directory.Exists(candidate))
                    {
                        extensionDir = Path.GetFullPath(candidate);
                    }
                }

                if (!Directory.Exists(extensionDir))
                {
                    MessageBox.Show(
                        "Could not locate the LetsMarkNow extension directory:\n" + extensionDir,
                        "LetsMarkNow Launcher",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                string profileDir = Path.Combine(baseDir, "Profile");
                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                bool forceChrome = false;
                foreach (string arg in args)
                {
                    if (string.Equals(arg, "--chrome", StringComparison.OrdinalIgnoreCase))
                    {
                        forceChrome = true;
                    }
                }

                string browserExe = FindChromiumBrowser(forceChrome);
                if (string.IsNullOrEmpty(browserExe))
                {
                    MessageBox.Show(
                        "No Chromium browser (Microsoft Edge or Google Chrome) was found on your system.\nPlease install Microsoft Edge or Google Chrome to run LetsMarkNow.",
                        "Browser Not Found",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }

                // Launch Chromium browser with unpacked extension loaded into isolated profile in fullscreen.
                // Microsoft Edge natively supports --load-extension on Windows without the branded Google Chrome 137+ command-line blocking.
                string launchArgs = string.Format(
                    "--load-extension=\"{0}\" --disable-extensions-except=\"{0}\" --user-data-dir=\"{1}\" --start-fullscreen --no-first-run --no-default-browser-check --disable-background-mode about:blank",
                    extensionDir,
                    profileDir
                );

                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = browserExe,
                    Arguments = launchArgs,
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Normal
                };

                Process.Start(startInfo);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Failed to launch LetsMarkNow: " + ex.Message,
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static void EnsureBackendRunning(string baseDir)
        {
            try
            {
                if (IsBackendHealthy(HealthCheckUrl))
                {
                    return;
                }

                string backendExe = LocateBackendExe(baseDir);
                if (!string.IsNullOrEmpty(backendExe) && File.Exists(backendExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = backendExe,
                        WorkingDirectory = Path.GetDirectoryName(backendExe),
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    Process.Start(psi);

                    // Wait up to 6 seconds for backend to become ready
                    for (int i = 0; i < 30; i++)
                    {
                        Thread.Sleep(200);
                        if (IsBackendHealthy(HealthCheckUrl))
                        {
                            break;
                        }
                    }
                }
            }
            catch
            {
                // Non-blocking; continue to browser launch
            }
        }

        private static string LocateBackendExe(string baseDir)
        {
            string[] candidates = new string[]
            {
                Path.Combine(baseDir, "backend.exe"),
                Path.Combine(baseDir, @"backend\backend.exe"),
                Path.Combine(baseDir, @"bin\backend.exe"),
                Path.Combine(baseDir, @"..\bin\backend.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"LetsMarkNow\backend.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"LetsMarkNow\backend\backend.exe")
            };

            foreach (string c in candidates)
            {
                if (File.Exists(c))
                {
                    return c;
                }
            }

            return null;
        }

        private static bool IsBackendHealthy(string url)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
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

        private static string FindChromiumBrowser(bool forceChrome)
        {
            if (forceChrome)
            {
                string chrome = GetChromePath();
                if (!string.IsNullOrEmpty(chrome)) return chrome;
                string edge = GetEdgePath();
                if (!string.IsNullOrEmpty(edge)) return edge;
            }
            else
            {
                // Edge natively supports --load-extension on Windows without branded Google Chrome 137+ command-line blocking
                string edge = GetEdgePath();
                if (!string.IsNullOrEmpty(edge)) return edge;
                string chrome = GetChromePath();
                if (!string.IsNullOrEmpty(chrome)) return chrome;
            }

            return null;
        }

        private static string GetChromePath()
        {
            string chromePath = GetAppPathFromRegistry("chrome.exe");
            if (!string.IsNullOrEmpty(chromePath) && File.Exists(chromePath))
            {
                return chromePath;
            }

            string[] chromePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string path in chromePaths)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }

            return null;
        }

        private static string GetEdgePath()
        {
            string edgePath = GetAppPathFromRegistry("msedge.exe");
            if (!string.IsNullOrEmpty(edgePath) && File.Exists(edgePath))
            {
                return edgePath;
            }

            string[] edgePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string path in edgePaths)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }

            return null;
        }

        private static string GetAppPathFromRegistry(string exeName)
        {
            string subKey = @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exeName;

            using (RegistryKey key = Registry.LocalMachine.OpenSubKey(subKey))
            {
                if (key != null)
                {
                    object val = key.GetValue("");
                    if (val != null)
                    {
                        return val.ToString();
                    }
                }
            }

            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(subKey))
            {
                if (key != null)
                {
                    object val = key.GetValue("");
                    if (val != null)
                    {
                        return val.ToString();
                    }
                }
            }

            return null;
        }
    }
}
