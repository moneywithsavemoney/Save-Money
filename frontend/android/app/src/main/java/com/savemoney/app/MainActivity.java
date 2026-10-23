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
            
            // WebView-এর ভেতরে UPI এবং External Intent Handling নিশ্চিত করা
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url == null) return false;

                    // UPI বা যেকোনো পেমেন্ট স্কিম ইউআরএল হলে
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
                    
                    // সাধারণ ওয়েবসাইটের লিংকের জন্য
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                        if (url.contains("save-moneyy-indol.vercel.app") || url.contains("razorpay.com")) {
                            return false; // অ্যাপের ভেতরেই ওয়েবপেইজ লোড হবে
                        }
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

            // লাইভ ওয়েবসাইট লোড করা
            webView.loadUrl("https://save-moneyy-indol.vercel.app");
        }
    }
}
