package com.twentywon.memory;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private AlertDialog exitDialog;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "!window.dispatchEvent(new Event('chagok-back', {cancelable:true}))",
                        handled -> {
                            if ("false".equals(handled)) {
                                confirmExit();
                            }
                        });
                }
            }
        });
    }
    private void confirmExit() {
        if (isFinishing() || isDestroyed() || exitDialog != null) {
            return;
        }
        exitDialog = new AlertDialog.Builder(this)
            .setTitle("앱 종료")
            .setMessage("앱을 종료할까요?")
            .setPositiveButton("예", (dialog, which) -> finish())
            .setNegativeButton("아니오", null)
            .setOnDismissListener(dialog -> exitDialog = null)
            .create();
        exitDialog.show();
    }

    @Override
    public void onDestroy() {
        if (exitDialog != null) {
            exitDialog.dismiss();
        }
        super.onDestroy();
    }
}
