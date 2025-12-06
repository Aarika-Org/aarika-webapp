import { createThirdwebClient } from "thirdweb";

// Replace with your actual Thirdweb Client ID from https://thirdweb.com/dashboard
// You can set this in your .env.local file as VITE_THIRDWEB_CLIENT_ID
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "YOUR_CLIENT_ID_HERE";

export const thirdwebClient = createThirdwebClient({
    clientId,
});
