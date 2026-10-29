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
        private const string HealthCheckUrl = "http://127.0.0.1:3000/v1/health";

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

                string initialTarget = "http://127.0.0.1:3000";
                bool forceEdge = false;
                foreach (string arg in args)
                {
                    if (string.Equals(arg, "--edge", StringComparison.OrdinalIgnoreCase))
                    {
                        forceEdge = true;
                    }
                    else if (arg.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                             arg.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        initialTarget = arg;
                    }
                }

                string browserExe = FindChromiumBrowser(forceEdge);
                if (string.IsNullOrEmpty(browserExe))
                {
                    MessageBox.Show(
                        "No Chromium browser (Google Chrome or Microsoft Edge) was found on your system.\nPlease install Google Chrome to run LetsMarkNow.",
                        "Browser Not Found",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }

                // Launch Chromium browser (Google Chrome preferred) with unpacked extension loaded into isolated profile.
                // Opens ONE window with TWO tabs: tab 1 = Extension App (app.html), tab 2 = Web Dashboard.
                // The extension ID is pinned by the "key" in the extension manifest, so the
                // chrome-extension:// URL below is stable for --load-extension from any install path.
                // The service worker's ensureExtensionWindow() de-dupes: it finds this tab and
                // focuses it instead of opening anything extra.
                string extensionTabUrl = GetPinnedExtensionAppUrl(extensionDir);
                string tabsArg = string.IsNullOrEmpty(extensionTabUrl)
                    ? string.Format("\"{0}\"", initialTarget)
                    : string.Format("\"{0}\" \"{1}\"", extensionTabUrl, initialTarget);

                // Chrome 137+ disables --load-extension by default; without this the
                // extension silently fails to load (no extension tab, no service worker).
                string launchArgs = string.Format(
                    "--load-extension=\"{0}\" --disable-extensions-except=\"{0}\" --disable-features=DisableLoadExtensionCommandLineSwitch --user-data-dir=\"{1}\" --start-maximized --no-first-run --no-default-browser-check --disable-background-mode {2}",
                    extensionDir,
                    profileDir,
                    tabsArg
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

                    // Wait up to 20 seconds for backend to become ready
                    for (int i = 0; i < 80; i++)
                    {
                        Thread.Sleep(250);
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

        /// <summary>
        /// Returns the chrome-extension:// URL for the bundled app.html, but ONLY when the
        /// extension manifest pins the extension ID with a "key" (making the ID predictable
        /// for --load-extension). Returns null otherwise so the launcher falls back to the
        /// previous single-tab behavior instead of opening a dead tab.
        /// </summary>
        private static string GetPinnedExtensionAppUrl(string extensionDir)
        {
            try
            {
                string manifestPath = Path.Combine(extensionDir, "manifest.json");
                string appHtmlPath = Path.Combine(extensionDir, "app.html");
                if (!File.Exists(manifestPath) || !File.Exists(appHtmlPath))
                {
                    return null;
                }

                string manifest = File.ReadAllText(manifestPath);
                if (manifest.IndexOf("\"key\"", StringComparison.OrdinalIgnoreCase) < 0)
                {
                    return null;
                }

                return "chrome-extension://" + StaticExtensionId + "/app.html";
            }
            catch
            {
                return null;
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
                // Prefer Google Chrome by default; fallback to Microsoft Edge if Chrome is not installed
                string chrome = GetChromePath();
                if (!string.IsNullOrEmpty(chrome)) return chrome;
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
