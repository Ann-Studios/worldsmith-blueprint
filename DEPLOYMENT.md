# Deployment Guide for Render

## 🚀 Deploying WebSocket Server on Render

### **1. Server Deployment**

1. **Create a new Web Service on Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name:** `worldsmith-server`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Plan:** Free (or paid for better WebSocket support)

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   RESEND_API_KEY=your_resend_api_key
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```

### **2. Frontend Deployment**

1. **Create a Static Site on Render:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure the site:**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

3. **Set Environment Variables:**
   ```
   VITE_WS_URL=wss://your-server-name.onrender.com
   VITE_API_URL=https://your-server-name.onrender.com
   ```

### **3. Important Notes**

⚠️ **Free Plan Limitations:**
- WebSocket connections may disconnect after 5 minutes
- Consider upgrading to paid plan for production use

✅ **WebSocket URLs:**
- Use `wss://` (secure WebSocket) for production
- Don't specify ports in the URL
- Example: `wss://worldsmith-server.onrender.com`

### **4. Testing Your Deployment**

1. **Check server logs** in Render dashboard
2. **Test WebSocket connection** in browser console:
   ```javascript
   const ws = new WebSocket('wss://your-server-name.onrender.com?userId=test&boardId=test');
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ```

### **5. Troubleshooting**

- **WebSocket not connecting:** Check if server is running and logs show WebSocket setup
- **CORS errors:** Ensure `CLIENT_URL` environment variable is set correctly
- **Connection drops:** This is normal on free plan; consider upgrading

## 🔧 Local Development

For local development, use:
```
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
```