package com.savemoney.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
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

            webView.setWebChromeClient(new WebChromeClient());

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
