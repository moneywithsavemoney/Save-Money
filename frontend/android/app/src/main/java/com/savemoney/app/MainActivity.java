package com.savemoney.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            
            // জাভাস্ক্রিপ্ট এবং ডোম স্টোরেজ এনাবল করা (লাইভ সাইটের স্মুথ পারফরম্যান্সের জন্য)
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setDatabaseEnabled(true);
            webView.getSettings().setAllowFileAccess(true);

            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url == null) return false;

                    // UPI বা যেকোনো পেমেন্ট স্কিম ইউআরএল হলে এক্সটার্নাল অ্যাপ ওপেন করবে
                    if (url.startsWith("upi://") || 
                        url.startsWith("tez://") || 
                        url.startsWith("phonepe://") || 
                        url.startsWith("paytmmp://") || 
                        url.startsWith("cred://") ||
                        url.startsWith("intent://")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    
                    // আপনার মূল ওয়েবসাইট বা Razorpay ডোমেইন হলে অ্যাপের ভেতরেই লোড হবে
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

            // সরাসরি আপনার লাইভ Vercel সাইট লোড করা (যাতে ফ্রন্টএন্ড চেঞ্জ করলে সাথে সাথে অ্যাপে আপডেট হয়)
            webView.loadUrl("https://save-moneyy-indol.vercel.app");
        }
    }
}
