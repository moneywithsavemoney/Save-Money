package com.savemoney.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // ব্রাউজারের মতো ইউজার এজেন্ট সেট করা যাতে Razorpay সব UPI অপশন দেখায়
            settings.setUserAgentString("Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");

            // পেমেন্ট গেটওয়ের পপআপ ও নতুন উইন্ডো হ্যান্ডেল করার জন্য WebChromeClient আপডেট
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView newWebView = new WebView(MainActivity.this);
                    WebSettings newSettings = newWebView.getSettings();
                    newSettings.setJavaScriptEnabled(true);
                    newSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                    newSettings.setDomStorageEnabled(true);
                    
                    newWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            if (url.startsWith("upi://") || url.startsWith("tez://") || url.startsWith("phonepe://") || url.startsWith("paytmmp://")) {
                                try {
                                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                    MainActivity.this.startActivity(intent);
                                    return true;
                                } catch (Exception e) {
                                    return false;
                                }
                            }
                            view.loadUrl(url);
                            return true;
                        }
                    });
                    
                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(newWebView);
                    resultMsg.sendToTarget();
                    return true;
                }
            });

            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url == null) return false;

                    // UPI বা পেমেন্ট স্কিম হলে এক্সটার্নাল অ্যাপে ওপেন করবে
                    if (url.startsWith("upi://") || 
                        url.startsWith("tez://") || 
                        url.startsWith("phonepe://") || 
                        url.startsWith("paytmmp://") || 
                        url.startsWith("cred://")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            MainActivity.this.startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            return false;
                        }
                    }

                    // Intent স্কিম হ্যান্ডলিং (Razorpay UPI Apps-এর জন্য)
                    if (url.startsWith("intent://")) {
                        try {
                            Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                            if (intent != null) {
                                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                                intent.setComponent(null);
                                intent.setSelector(null);
                                
                                try {
                                    MainActivity.this.startActivity(intent);
                                    return true;
                                } catch (Exception e) {
                                    String fallbackUrl = intent.getStringExtra("browser_fallback_url");
                                    if (fallbackUrl != null) {
                                        view.loadUrl(fallbackUrl);
                                        return true;
                                    }
                                    return false;
                                }
                            }
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    
                    // মূল ওয়েবসাইট অ্যাপের ভেতরেই লোড হবে
                    if (url.contains("save-moneyy-indol.vercel.app") || url.contains("razorpay.com")) {
                        return false; 
                    }

                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        MainActivity.this.startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return true;
                    }
                }
            });

            // লাইভ Vercel সাইট লোড করা
            webView.loadUrl("https://save-moneyy-indol.vercel.app");
        }
    }
}
