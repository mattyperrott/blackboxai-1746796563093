package io.epher.chat.ygg

import android.content.Intent
import android.net.VpnService
import java.io.File

class YggVpnService : VpnService() {
    private var proc: Process? = null

    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int {
        if (proc != null) return START_STICKY

        val iface = Builder()
            .addAddress("200::1", 7)
            .addRoute("::", 0)
            .setSession("Epher-Ygg")
            .establish() ?: return START_NOT_STICKY

        val yggBin = File(filesDir, "ygg.android").apply {
            if (!exists()) {
                assets.open("bin/ygg.android").copyTo(outputStream())
                setExecutable(true, false)
            }
        }

        proc = ProcessBuilder(
            yggBin.absolutePath,
            "-tunfd", iface.fileDescriptor.fd.toString(),
            "-socks", "9001",
            "-subnet", "200::/7"
        ).redirectErrorStream(true).start()

        return START_STICKY
    }

    override fun onDestroy() {
        proc?.destroy(); proc = null; super.onDestroy()
    }
}