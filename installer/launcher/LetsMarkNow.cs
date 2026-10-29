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

        private const string LaunchHtmlContent = @"<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <title>Starting LetsMarkNow...</title>
  <style>
    body {
      background: #090A0F;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      user-select: none;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      border-top-color: #6366f1;
      animation: spin 0.8s ease-in-out infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .text {
      font-size: 14px;
      letter-spacing: 0.05em;
    }
  </style>
  <script>
    setTimeout(function() {
      window.location.replace(""chrome-extension://pnfhjpjocddcolcnlginjoblglphhgpm/app.html"");
    }, 400);
  </script>
</head>
<body>
  <div class=""spinner""></div>
  <div class=""text"">Launching LetsMarkNow...</div>
</body>
</html>";

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

                // Ensure launch.html exists in baseDir as a startup bridge to eliminate race condition
                string launchHtmlPath = Path.Combine(baseDir, "launch.html");
                try
                {
                    File.WriteAllText(launchHtmlPath, LaunchHtmlContent);
                }
                catch
                {
                    // If write fails, try Temp directory
                    launchHtmlPath = Path.Combine(Path.GetTempPath(), "LetsMarkNow-launch.html");
                    File.WriteAllText(launchHtmlPath, LaunchHtmlContent);
                }

                bool forceEdge = false;
                foreach (string arg in args)
                {
                    if (string.Equals(arg, "--edge", StringComparison.OrdinalIgnoreCase))
                    {
                        forceEdge = true;
                    }
                }

                // Primary browser is Google Chrome
                string browserExe = FindChromiumBrowser(forceEdge);
                if (string.IsNullOrEmpty(browserExe))
                {
                    MessageBox.Show(
                        "Google Chrome was not found on your system.\nPlease install Google Chrome to run LetsMarkNow.",
                        "Browser Not Found",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }

                // Launch browser with unpacked extension loaded into isolated profile in fullscreen
                string launchArgs = string.Format(
                    "--load-extension=\"{0}\" --user-data-dir=\"{1}\" --start-fullscreen --no-first-run --no-default-browser-check \"{2}\"",
                    extensionDir,
                    profileDir,
                    launchHtmlPath
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

        private static string FindChromiumBrowser(bool forceEdge)
        {
            if (forceEdge)
            {
                string edge = GetEdgePath();
                if (!string.IsNullOrEmpty(edge)) return edge;
                string chrome = GetChromePath();
                if (!string.IsNullOrEmpty(chrome)) return chrome;
            }
            else
            {
                // Prioritize Google Chrome first
                string chrome = GetChromePath();
                if (!string.IsNullOrEmpty(chrome)) return chrome;
                // Fallback to Edge only if Chrome is not installed
                string edge = GetEdgePath();
                if (!string.IsNullOrEmpty(edge)) return edge;
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
