package com.savemoney.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // অ্যাপ খোলার সাথে সাথেই লাইভ ওয়েবসাইট লোড করার নির্দেশ
        if (this.bridge != null) {
            this.bridge.getWebView().loadUrl("https://save-moneyy-indol.vercel.app");
        }
    }
}
