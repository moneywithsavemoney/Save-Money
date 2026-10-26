package com.savemoney.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import com.getapp.capacitor.BridgeActivity; // আপনার প্রজেক্টের প্যাকেজ অনুযায়ী আমপোর্ট ঠিক রাখুন

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

                    // UPI এবং পেমেন্ট স্কিমগুলো এক্সটার্নাল অ্যাপে ওপেন করার জন্য
                    if (url.startsWith("upi://") || 
                        url.startsWith("tez://") || 
                        url.startsWith("phonepe://") || 
                        url.startsWith("paytmmp://") || 
                        url.startsWith("cred://")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            return false;
                        }
                    }

                    // Intent স্কিম হ্যান্ডলিং (Razorpay UPI Apps-এর জন্য এটি অত্যন্ত জরুরি)
                    if (url.startsWith("intent://")) {
                        try {
                            Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                            if (intent != null) {
                                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                                intent.setComponent(null);
                                intent.setSelector(null);
                                
                                // যদি সংশ্লিষ্ট UPI অ্যাপ ইনস্টল থাকে তবে ওপেন হবে
                                try {
                                    startActivity(intent);
                                    return true;
                                } catch (Exception e) {
                                    // ফলব্যাক ইউআরএল ব্রাউজারে রিডাইরেক্ট করা
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
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return true;
                    }
                }
            });

            // লাইভ Vercel সাইট লোড করা[span_11](start_span)[span_11](end_span)
            webView.loadUrl("https://save-moneyy-indol.vercel.app");
        }
    }
}
