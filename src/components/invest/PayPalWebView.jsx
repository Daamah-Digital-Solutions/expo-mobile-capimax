// PayPal checkout hosted in a WebView (mobile equivalent of the web's
// @paypal/react-paypal-js PayPalButtons). Loads the LIVE PayPal JS SDK with the same
// client id + options as the web, creates the same purchase_units order, captures it,
// and posts the capture result back to RN. RN then calls process_paypal_payment.
//
// LIVE PAYMENTS: real money moves the moment the buyer approves. No sandbox.
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

function buildHtml({ clientId, currency, amount, opportunityId, shares, description }) {
  const value = (Number(amount) || 0).toFixed(2);
  // SDK options mirror the web (paypal-integration.jsx): capture intent, card funding on,
  // paylater + venmo off.
  const sdk = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons&enable-funding=card&disable-funding=paylater,venmo`;
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html,body{margin:0;padding:0;background:#ffffff;font-family:-apple-system,Roboto,Arial,sans-serif;}
  #wrap{padding:18px 16px;}
  #status{color:#444;font-size:14px;text-align:center;margin-top:14px;min-height:18px;}
</style></head><body>
<div id="wrap"><div id="paypal-button-container"></div><div id="status"></div></div>
<script src="${sdk}"></script>
<script>
  var RN = window.ReactNativeWebView;
  function post(o){ try{ RN.postMessage(JSON.stringify(o)); }catch(e){} }
  function setStatus(t){ var s=document.getElementById('status'); if(s) s.textContent=t||''; }
  function start(){
    if(!window.paypal){ post({type:'error', message:'PayPal SDK failed to load'}); return; }
    paypal.Buttons({
      style:{ layout:'vertical', shape:'rect', label:'paypal', height:55, tagline:false },
      createOrder:function(data, actions){
        return actions.order.create({
          intent:'CAPTURE',
          purchase_units:[{
            reference_id:'INV-${opportunityId}-'+Date.now(),
            description:${JSON.stringify(description)},
            amount:{ currency_code:'${currency}', value:'${value}',
              breakdown:{ item_total:{ currency_code:'${currency}', value:'${value}' } } },
            items:[{ name:'Shares', description:${JSON.stringify(description)}, quantity:'1',
              unit_amount:{ currency_code:'${currency}', value:'${value}' } }]
          }],
          application_context:{ shipping_preference:'NO_SHIPPING', user_action:'PAY_NOW' }
        });
      },
      onApprove:function(data, actions){
        setStatus('Processing payment...');
        return actions.order.capture().then(function(cap){
          if(cap.status !== 'COMPLETED'){ post({type:'error', message:'Payment status is '+cap.status}); return; }
          var pu = (cap.purchase_units && cap.purchase_units[0]) || {};
          var capture = pu.payments && pu.payments.captures && pu.payments.captures[0];
          var captureId = capture && capture.id;
          if(!captureId){ post({type:'error', message:'No capture ID found in payment response'}); return; }
          post({ type:'approved', orderId:data.orderID, captureId:captureId, status:cap.status,
            payer:cap.payer, capture:capture, create_time:cap.create_time, update_time:cap.update_time });
        }).catch(function(err){ post({type:'error', message:(err&&err.message)||'Payment processing failed'}); });
      },
      onCancel:function(){ post({type:'cancel'}); },
      onError:function(err){ post({type:'error', message:(err&&err.message)||'PayPal encountered an error'}); }
    }).render('#paypal-button-container').catch(function(err){ post({type:'error', message:(err&&err.message)||'Failed to render PayPal'}); });
  }
  if(window.paypal){ start(); } else { window.addEventListener('load', start); }
</script></body></html>`;
}

export default function PayPalWebView({ clientId, currency = "USD", amount, opportunityId, shares, webOrigin, onApproved, onCancel, onError }) {
  const { t } = useTranslation();
  const { theme, type } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const description = t("payment.investmentDescription", "Purchase of asset {{opportunityId}} - {{shares}} shares", { opportunityId, shares });
  const html = useMemo(
    () => buildHtml({ clientId, currency, amount, opportunityId, shares, description }),
    [clientId, currency, amount, opportunityId, shares, description]
  );

  const onMessage = (e) => {
    let msg;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === "approved") onApproved?.(msg);
    else if (msg.type === "cancel") onCancel?.();
    else if (msg.type === "error") onError?.(msg.message);
  };

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[type.label, { color: theme.text }]}>PayPal</Text>
        <Pressable onPress={onCancel} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={22} color={theme.text} />
        </Pressable>
      </View>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: webOrigin || "https://www.paypal.com" }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
        style={{ backgroundColor: "#ffffff" }}
      />
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    fill: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.bg, zIndex: 50 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    close: { padding: 4 },
    loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  });
