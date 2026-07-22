# 烧烤联机助手 - 安卓 APK 打包指南 🚀

这是一个用 HTML/CSS/JS 开发的网页版 App。由于它不依赖任何后端数据库（使用了公共的 MQTT 联机通道和手机本地浏览器存储），因此可以极其简单地打包成一个标准的安卓 `.apk` 安装包。

以下是三种最方便的免费打包方案，推荐使用 **方案一**（完全在线，不需要下载任何软件）：

---

## 方案一：使用免费在线打包网站（最快最方便 ⭐⭐⭐⭐⭐）

有许多免费提供“网站/网页文件转 APK”的在线服务。由于我们是**本地文件夹**，你可以使用支持打包本地 ZIP 压缩包的打包网站。

### 推荐打包步骤：

1. **压缩文件**：
   在电脑上打开 `E:\cursorProject\projects\bbq-helper`，将这三个文件（`index.html`、`style.css`、`app.js`）一起全选，右键压缩为 **`zip` 格式** 的压缩包（命名为 `bbq-helper.zip`）。
   > **注意**：压缩包内直接是这三个文件，不要多嵌套一层文件夹。

2. **选择打包平台**（推荐以下几个常用、免费且无广告的平台）：
   - **网址 1**：[LoliApp 在线打包 (https://www.loliapp.com/tools/website-to-apk/)](https://www.loliapp.com/tools/website-to-apk/) 或者类似的在线 HTML 转 APK 服务。
   - **网址 2**：使用 [Website 2 APK Builder](https://website2apk.com/)（提供免费桌面客户端，可以直接把 HTML 文件夹一键转为 APK 安装包）。
   - **网址 3**：使用国内如“木子网”、“网侠手机打包”等免费一键打包平台，直接上传你的 `.zip` 压缩包。

3. **填写 App 基本信息**：
   - **应用名称**：烧烤联机助手
   - **包名**：`com.bbq.helper` (可不改)
   - **入口文件**：`index.html`
   - **版本号**：`1.0.0`
   - **屏幕方向**：锁定竖屏 (Portrait)

4. **点击“开始打包”**：
   网站会自动处理，处理完成后会提供一个 `.apk` 安装包的下载链接。

5. **手机安装**：
   通过微信、QQ 或手机数据线将 `.apk` 文件发送到你的安卓手机上，在手机中点击文件安装即可！

---

## 方案二：使用 Android Studio 里的 WebView（最正规，需要下载 SDK）

如果你有开发经验，或者想完全掌控打包过程，可以使用 Android Studio 新建一个空白安卓项目，在 `MainActivity` 里放一个全屏的 `WebView`：

1. 打开 Android Studio，创建一个 "Empty Views Activity" 级别的项目。
2. 将 `index.html`、`style.css` 和 `app.js` 复制到安卓项目的 `app/src/main/assets/` 目录下。
3. 在 `MainActivity.java` 中写入：
   ```java
   WebView webView = findViewById(R.id.webview);
   webView.getSettings().setJavaScriptEnabled(true);
   webView.getSettings().setDomStorageEnabled(true); // 必须开启，用于本地订单存储
   webView.getSettings().setMediaPlaybackRequiresUserGesture(false); // 允许自动播放叮咚声
   webView.loadUrl("file:///android_asset/index.html");
   ```
4. 在 `AndroidManifest.xml` 中加入网络权限和网络安全配置（因为 MQTT 实时联机需要联网）：
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```
5. 点击 `Build -> Build Bundle(s) / APK(s) -> Build APK(s)`，编译出 APK 并拷贝到手机上安装。

---

## 💡 本地快速联机预览测试方法

在进行 APK 打包前，如果你想立刻在两台手机上测试同步和声音效果，可以用最简单的方法：

1. **在电脑上启动一个极简的临时服务器**：
   由于你安装了 Node.js，可以在电脑终端运行：
   ```powershell
   npx http-server E:\cursorProject\projects\bbq-helper -p 8080
   ```
2. **手机访问**：
   确保你的手机和电脑连接在同一个 Wi-Fi 下。
   在电脑终端上会显示一个 IP 地址（如 `http://192.168.1.100:8080`）。
   用手机浏览器直接打开这个网址，两台手机输入同一个房间号，就能立即体验到一端点单、另一端“叮咚 + 语音播报”的完美同步效果！
