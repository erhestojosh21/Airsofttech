import { useEffect, useState } from "react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalButton = ({ amount, onSuccess }) => {
  const [usdAmount, setUsdAmount] = useState(null);

  useEffect(() => {
    const convertCurrency = async () => {
      try {
        const response = await axios.get(
          `https://api.frankfurter.app/latest?amount=${amount}&from=PHP&to=USD`
        );
        setUsdAmount(response.data.rates.USD.toFixed(2));
      } catch (err) {
        console.error("Conversion failed", err);
      }
    };

    if (amount > 0) convertCurrency();
  }, [amount]);

  return (
    <PayPalScriptProvider options={{ "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID, currency: "USD" }}>
      {usdAmount && (
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: usdAmount,
                  },
                },
              ],
              application_context: {
                shipping_preference: "NO_SHIPPING",
                cancel_url: window.location.origin + "/checkout",
              },
            });
          }}
          onApprove={(data, actions) =>
            actions.order.capture().then((details) => {
              onSuccess(details);
            })
          }
        />
      )}
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
