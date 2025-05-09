package io.epher.chat.node

import android.content.Context
import android.net.LocalSocket
import android.net.LocalSocketAddress
import android.webkit.JavascriptInterface
import android.webkit.WebView
import java.io.BufferedWriter
import java.io.OutputStreamWriter

package io.epher.chat.node

import android.content.Context
import android.net.LocalSocket
import android.net.LocalSocketAddress
import android.webkit.JavascriptInterface
import android.webkit.WebView
import io.epher.chat.ygg.YggVpnService
import java.io.BufferedWriter
import java.io.OutputStreamWriter
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

class NodeJSBridge(private val ctx: Context, private val web: WebView) {
    private var writer: BufferedWriter? = null
    private var isConnected = AtomicBoolean(false)
    private var useYggdrasil = AtomicBoolean(false)
    private val scheduler: ScheduledExecutorService = Executors.newSingleThreadScheduledExecutor()
    private var reconnectJob: java.util.concurrent.Future<*>? = null

    init {
        try {
            NodeJS.start(ctx)
            connectSocket()
        } catch (e: Exception) {
            notifyError("Failed to initialize Node.js: ${e.message}")
        }
    }

    private fun connectSocket() {
        try {
            updateConnectionStatus("connecting")
            val sock = LocalSocket()
            sock.connect(LocalSocketAddress("epher.sock", LocalSocketAddress.Namespace.FILESYSTEM))
            
            writer = BufferedWriter(OutputStreamWriter(sock.outputStream))
            
            // Start reading from socket in a separate thread
            Thread {
                try {
                    sock.inputStream.bufferedReader().lineSequence().forEach { line ->
                        handleIncomingMessage(line)
                    }
                } catch (e: Exception) {
                    handleDisconnect("Socket read error: ${e.message}")
                }
            }.start()

        } catch (e: Exception) {
            handleDisconnect("Socket connection failed: ${e.message}")
        }
    }

    private fun handleIncomingMessage(line: String) {
        try {
            val json = JSONObject(line)
            when (json.optString("type")) {
                "connected" -> {
                    isConnected.set(true)
                    updateConnectionStatus("connected")
                }
                "message" -> {
                    web.post { 
                        web.evaluateJavascript(
                            "window._onBackendMessage(${json.getJSONObject("data")})",
                            null
                        )
                    }
                }
                "error" -> notifyError(json.getString("error"))
                else -> web.post { 
                    web.evaluateJavascript("window._onBackendMessage($line)", null)
                }
            }
        } catch (e: Exception) {
            notifyError("Failed to process message: ${e.message}")
        }
    }

    @JavascriptInterface
    fun join(room: String, preKeyBundle: String) {
        try {
            val command = JSONObject().apply {
                put("cmd", "join")
                put("room", room)
                put("preKeyBundle", JSONObject(preKeyBundle))
                put("transport", if (useYggdrasil.get()) "yggdrasil" else "direct")
            }
            send(command.toString())
        } catch (e: Exception) {
            notifyError("Failed to join room: ${e.message}")
        }
    }

    @JavascriptInterface
    fun sendMessage(payload: String) {
        try {
            if (!isConnected.get()) {
                notifyError("Not connected to chat network")
                return
            }
            val command = JSONObject().apply {
                put("cmd", "send")
                put("data", JSONObject(payload))
            }
            send(command.toString())
        } catch (e: Exception) {
            notifyError("Failed to send message: ${e.message}")
        }
    }

    @JavascriptInterface
    fun setTransport(useYgg: Boolean) {
        try {
            if (useYgg == useYggdrasil.get()) return
            
            useYggdrasil.set(useYgg)
            if (useYgg) {
                if (!YggVpnService.isVpnActive(ctx)) {
                    YggVpnService.start(ctx)
                }
            } else {
                YggVpnService.stop(ctx)
            }
            
            // Reconnect with new transport
            handleDisconnect("Switching transport mode")
        } catch (e: Exception) {
            notifyError("Failed to switch transport: ${e.message}")
        }
    }

    private fun send(json: String) {
        writer?.apply {
            try {
                write(json)
                newLine()
                flush()
            } catch (e: Exception) {
                handleDisconnect("Failed to send data: ${e.message}")
                throw e
            }
        } ?: throw IllegalStateException("Socket not connected")
    }

    private fun handleDisconnect(error: String) {
        if (isConnected.get()) {
            isConnected.set(false)
            writer = null
            notifyError(error)
            updateConnectionStatus("disconnected")
            
            // Schedule reconnection attempt
            reconnectJob?.cancel(false)
            reconnectJob = scheduler.schedule({
                connectSocket()
            }, 5, TimeUnit.SECONDS)
        }
    }

    private fun notifyError(error: String) {
        web.post {
            web.evaluateJavascript(
                "window._onBackendError('${error.replace("'", "\\'")}')",
                null
            )
        }
    }

    private fun updateConnectionStatus(status: String) {
        web.post {
            web.evaluateJavascript(
                "window._onConnectionStatus('$status')",
                null
            )
        }
    }

    fun cleanup() {
        try {
            scheduler.shutdown()
            reconnectJob?.cancel(true)
            writer?.close()
            writer = null
            isConnected.set(false)
            if (useYggdrasil.get()) {
                YggVpnService.stop(ctx)
            }
        } catch (e: Exception) {
            notifyError("Cleanup error: ${e.message}")
        }
    }
}