package io.epher.chat

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import io.epher.chat.node.NodeJSBridge
import io.epher.chat.ui.TransportSheet

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val nav = rememberNavController()

            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text("Epher") },
                        actions = {
                            IconButton(onClick = { nav.navigate("privacy") }) {
                                Icon(Icons.Default.Security, null)
                            }
                        }
                    )
                }
            ) { padding ->
                NavHost(nav, startDestination = "chat", Modifier.fillMaxSize()) {
                    composable("chat") {
                        val webView = remember {
                            WebView(this@MainActivity).apply {
                                settings.javaScriptEnabled = true
                                val bridge = NodeJSBridge(context, this)
                                addJavascriptInterface(bridge, "AndroidBridge")
                                loadUrl("file:///android_asset/index.html")
                            }
                        }
                        AndroidView({ webView }, Modifier.fillMaxSize())
                    }
                    composable("privacy") { TransportSheet() }
                }
            }
        }
    }
}