package io.epher.chat.node

import android.content.Context
import java.io.File
import java.util.zip.ZipInputStream

object NodeJS {
    private const val PROJECT_ZIP = "nodejs-project.zip"
    private const val PROJECT_DIR = "nodejs-project"
    private const val ENTRY_JS = "start.js"

    fun start(ctx: Context) {
        val proj = File(ctx.filesDir, PROJECT_DIR)
        if (!proj.exists()) extract(ctx, proj)

        val abi = android.os.Build.SUPPORTED_ABIS.first()
        val node = File(ctx.filesDir, "node-$abi").apply {
            if (!exists()) {
                ctx.assets.open("bin/$abi/node").copyTo(outputStream())
                setExecutable(true, false)
            }
        }

        ProcessBuilder(node.absolutePath, ENTRY_JS)
            .directory(proj)
            .redirectErrorStream(true)
            .start()
    }

    private fun extract(ctx: Context, dest: File) {
        dest.mkdirs()
        ctx.assets.open(PROJECT_ZIP).use { zipIn ->
            ZipInputStream(zipIn).use { zin ->
                var e = zin.nextEntry
                while (e != null) {
                    val outFile = File(dest, e.name)
                    if (e.isDirectory) outFile.mkdirs() else zin.copyTo(outFile.outputStream())
                    e = zin.nextEntry
                }
            }
        }
    }
}