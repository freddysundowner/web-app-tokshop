// server.ts
import dotenv from "dotenv";

// ../shared-backend/server/index.ts
import express2 from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

// ../shared-backend/server/routes.ts
import { createServer } from "http";

// ../shared-backend/server/routes/dashboard.ts
import fetch2 from "node-fetch";

// ../shared-backend/server/utils.ts
if (!process.env.BASE_URL) {
  throw new Error("BASE_URL environment variable is required");
}
var BASE_URL = process.env.BASE_URL.replace(/\/$/, "");
console.log(`[API Config] BASE_URL: ${BASE_URL}`);

// ../shared-backend/server/routes/dashboard.ts
function registerDashboardRoutes(app2) {
  app2.get("/api/dashboard/metrics", async (req, res) => {
    try {
      console.log("Proxying dashboard metrics request to Icona API");
      const response = await fetch2(`${BASE_URL}/orders/dashboard/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Dashboard metrics proxy error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics from Icona API" });
    }
  });
}

// ../shared-backend/server/routes/orders.ts
import fetch3 from "node-fetch";
import { z } from "zod";
function registerOrderRoutes(app2) {
  app2.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      console.log("Fetching single order:", orderId);
      const url = `${BASE_URL}/orders/?_id=${orderId}`;
      console.log("Final API URL being called:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch3(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({
            success: false,
            error: "Order not found"
          });
        }
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Order data structure:", Object.keys(data));
      const order = data.orders?.[0] || data.data?.orders?.[0];
      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found"
        });
      }
      console.log("Order fields:", Object.keys(order));
      console.log("Order items:", order.items?.length || 0);
      if (order.items && order.items[0]) {
        console.log("First item fields:", Object.keys(order.items[0]));
      }
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error("Single order fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch order from Icona API"
      });
    }
  });
  app2.get("/api/orders", async (req, res) => {
    try {
      console.log("Proxying orders request to Icona API");
      console.log("Query params received:", req.query);
      const queryParams = new URLSearchParams();
      if (req.query.userId) {
        queryParams.set("userId", req.query.userId);
      }
      if (req.query.status && req.query.status !== "all") {
        queryParams.set("status", req.query.status);
      }
      if (req.query.page) {
        queryParams.set("page", req.query.page);
      }
      if (req.query.limit) {
        queryParams.set("limit", req.query.limit);
      }
      if (req.query.invoice) {
        queryParams.set("invoice", req.query.invoice);
      }
      if (req.query.customer) {
        queryParams.set("customer", req.query.customer);
      }
      if (req.query.customerId) {
        queryParams.set("customerId", req.query.customerId);
      }
      if (req.query.day) {
        queryParams.set("day", req.query.day);
      }
      if (req.query.tokshow) {
        queryParams.set("tokshow", req.query.tokshow);
      }
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/orders${queryString ? "?" + queryString : ""}`;
      console.log("Final API URL being called:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch3(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Orders proxy error:", error);
      res.status(500).json({ error: "Failed to fetch orders from Icona API" });
    }
  });
  app2.post("/api/orders/:id", async (req, res) => {
    try {
      console.log("Creating order (checkout) with payload:", JSON.stringify(req.body, null, 2));
      const checkoutSchema = z.object({
        product: z.string(),
        status: z.string().default("processing"),
        shippingFee: z.union([z.string(), z.number()]),
        servicelevel: z.string().optional(),
        rate_id: z.string().optional(),
        bundleId: z.string().optional(),
        totalWeightOz: z.union([z.string(), z.number()]).optional(),
        seller_shipping_fee_pay: z.union([z.string(), z.number()]).optional(),
        subtotal: z.union([z.string(), z.number()]),
        tax: z.union([z.string(), z.number()]),
        seller: z.string(),
        buyer: z.string(),
        quantity: z.number(),
        total: z.union([z.string(), z.number()]),
        color: z.string().optional(),
        size: z.string().optional(),
        tokshow: z.string().optional()
      });
      const orderData = checkoutSchema.parse(req.body);
      console.log("Validated order data:", orderData);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch3(`${BASE_URL}/orders/${req.params.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to create order in Icona API:", response.status, errorText);
        return res.status(response.status).json({
          success: false,
          error: `Failed to create order: ${response.status}`,
          details: errorText
        });
      }
      const createdOrder = await response.json();
      console.log("Order created successfully:", createdOrder);
      res.json({
        success: true,
        data: createdOrder
      });
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid order data",
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: "Failed to create order"
      });
    }
  });
  app2.patch("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;
      console.log("Updating order:", orderId, "with data:", updateData);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch3(`${BASE_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updateData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to update order in Icona API:", response.status, errorText);
        return res.status(response.status).json({
          error: `Failed to update order: ${response.status}`,
          details: errorText
        });
      }
      const updatedOrder = await response.json();
      console.log("Order updated successfully:", updatedOrder);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Order update error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });
  app2.put("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;
      console.log("PUT updating order:", orderId, "with data:", updateData);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch3(`${BASE_URL}/orders/${orderId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to PUT update order in Icona API:", response.status, errorText);
        return res.status(response.status).json({
          error: `Failed to update order: ${response.status}`,
          details: errorText
        });
      }
      const updatedOrder = await response.json();
      console.log("Order PUT updated successfully:", updatedOrder);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Order PUT update error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });
  app2.post("/api/orders/bundle/:idParam/ship", async (req, res) => {
    try {
      const { idParam } = req.params;
      console.log("Marking bundle as shipped, received ID:", idParam);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const userId = req.body.userId || req.query.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required"
        });
      }
      const ordersResponse = await fetch3(`${BASE_URL}/orders?userId=${userId}`, {
        method: "GET",
        headers
      });
      if (!ordersResponse.ok) {
        throw new Error("Failed to fetch orders");
      }
      const ordersData = await ordersResponse.json();
      const allOrders = ordersData.orders || [];
      const orderById = allOrders.find((order) => order._id === idParam);
      const bundleId = orderById?.bundleId || idParam;
      console.log(`Resolved bundleId: ${bundleId} (from ${orderById ? "order" : "direct bundleId"})`);
      const bundleOrders = allOrders.filter((order) => order.bundleId === bundleId);
      if (bundleOrders.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No orders found with this bundleId"
        });
      }
      console.log(`Found ${bundleOrders.length} orders to ship for bundle ${bundleId}`);
      const shipPromises = bundleOrders.map(
        (order) => fetch3(`${BASE_URL}/orders/${order._id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            status: "shipped",
            relist: false,
            bundleId
          })
        })
      );
      const results = await Promise.all(shipPromises);
      const failedShipments = results.filter((response) => !response.ok);
      if (failedShipments.length > 0) {
        return res.status(500).json({
          success: false,
          error: `Failed to ship ${failedShipments.length} orders in bundle`
        });
      }
      res.json({
        success: true,
        shippedOrders: bundleOrders.length
      });
    } catch (error) {
      console.error("Bundle ship error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to ship bundle"
      });
    }
  });
  app2.post("/api/orders/bundle/orders", async (req, res) => {
    try {
      const bundleRequestSchema = z.object({
        orderIds: z.array(z.string().min(1, "Order ID cannot be empty")).min(1, "At least one order ID is required")
      });
      const { orderIds } = bundleRequestSchema.parse(req.body);
      console.log("Creating bundle for orders:", orderIds);
      const fetchHeaders = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        fetchHeaders["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const ordersResponse = await fetch3(`${BASE_URL}/orders?userId=${req.query.userId || req.body.userId}`, {
        method: "GET",
        headers: fetchHeaders
      });
      if (!ordersResponse.ok) {
        return res.status(500).json({
          success: false,
          message: "Failed to validate order status",
          error: "Could not fetch orders for validation"
        });
      }
      const ordersData = await ordersResponse.json();
      const orders = ordersData.orders || [];
      const invalidOrders = orderIds.filter((orderId) => {
        const order = orders.find((o) => o._id === orderId);
        return !order || order.status !== "processing";
      });
      if (invalidOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Only orders with 'processing' status can be bundled",
          error: `Invalid orders: ${invalidOrders.join(", ")}`
        });
      }
      const response = await fetch3(`${BASE_URL}/orders/bundle/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderIds })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create bundle via external API" }));
        console.error("External API bundle creation failed:", response.status, errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message || "Failed to create bundle via external API"
        });
      }
      const bundleResult = await response.json();
      console.log("Bundle created successfully via external API:", bundleResult);
      res.json({
        success: true,
        message: "Bundle created successfully",
        data: bundleResult
      });
    } catch (error) {
      console.error("Bundle creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid request data",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to create bundle" });
    }
  });
  app2.post("/api/orders/unbundle/orders", async (req, res) => {
    try {
      console.log("=== UNBUNDLE ENDPOINT CALLED ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const unbundleRequestSchema = z.object({
        orderId: z.string().min(1, "Order ID is required"),
        itemIds: z.array(z.string().min(1, "Item ID cannot be empty")).min(1, "At least one item ID is required")
      });
      const { orderId, itemIds } = unbundleRequestSchema.parse(req.body);
      console.log("Unbundling items from order:", orderId, "Items:", itemIds);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch3(`${BASE_URL}/orders/unbundle/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({ orderId, itemIds })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to unbundle items via external API" }));
        console.error("External API unbundle failed:", response.status, errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message || "Failed to unbundle items via external API"
        });
      }
      const unbundleResult = await response.json();
      console.log("Items unbundled successfully via external API:", unbundleResult);
      res.json({
        success: true,
        message: "Items unbundled successfully",
        data: unbundleResult
      });
    } catch (error) {
      console.error("Unbundle error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid request data",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to unbundle items" });
    }
  });
}

// ../shared-backend/server/routes/shows.ts
function registerShowRoutes(app2) {
  app2.get("/api/profile/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Fetching public user profile:", id);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: "User not found" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching user from Icona API:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.get("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Fetching single room:", id);
      const queryParams = new URLSearchParams();
      if (req.query.currentUserId) {
        queryParams.set("currentUserId", req.query.currentUserId);
      }
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const url = `${BASE_URL}/rooms/${id}?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: "Room not found" });
      }
      const data = await response.json();
      const activeAuction = data.activeauction || data.activeAuction || data.active_auction;
      if (activeAuction) {
        console.log("\u{1F50D} EXTERNAL API activeauction bids:", activeAuction.bids);
        console.log("\u{1F50D} EXTERNAL API activeauction ended:", activeAuction.ended);
        console.log("\u{1F50D} EXTERNAL API activeauction winner:", activeAuction.winner);
      }
      res.json(data);
    } catch (error) {
      console.error("Error fetching room from Icona API:", error);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });
  app2.put("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Updating room:", id, "with data:", req.body);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const url = `${BASE_URL}/rooms/${id}`;
      console.log("Calling external API:", url);
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return res.status(response.status).json({ error: "Failed to update room" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error updating room from Icona API:", error);
      res.status(500).json({ error: "Failed to update room" });
    }
  });
  app2.delete("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Deleting room:", id);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const queryParams = new URLSearchParams();
      if (req.query.destroy) {
        queryParams.set("destroy", req.query.destroy);
      }
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/rooms/${id}${queryString ? `?${queryString}` : ""}`;
      console.log("Calling external API:", url);
      const response = await fetch(url, {
        method: "DELETE",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return res.status(response.status).json({ error: "Failed to delete room" });
      }
      const data = await response.json();
      console.log("Room deleted successfully:", data);
      res.json(data);
    } catch (error) {
      console.error("Error deleting room from Icona API:", error);
      res.status(500).json({ error: "Failed to delete room" });
    }
  });
  app2.post("/api/rooms", async (req, res) => {
    try {
      console.log("Creating room/show via Icona API");
      console.log("Request body:", req.body);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const url = `${BASE_URL}/rooms`;
      console.log("Calling external API:", url);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return res.status(response.status).json({ error: "Failed to create room" });
      }
      const data = await response.json();
      console.log("Room created successfully:", data);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating room via Icona API:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });
  app2.get("/api/rooms", async (req, res) => {
    try {
      console.log("Proxying rooms request to Icona API");
      const params = [];
      if (req.query.page !== void 0) params.push(`page=${req.query.page}`);
      if (req.query.limit !== void 0) params.push(`limit=${req.query.limit}`);
      if (req.query.category !== void 0) params.push(`category=${req.query.category}`);
      if (req.query.userid !== void 0) params.push(`userid=${req.query.userid}`);
      if (req.query.currentUserId !== void 0) params.push(`currentUserId=${req.query.currentUserId}`);
      if (req.query.title !== void 0) params.push(`title=${req.query.title}`);
      if (req.query.status !== void 0) params.push(`status=${req.query.status}`);
      const queryString = params.join("&");
      const url = `${BASE_URL}/rooms?${queryString}`;
      console.log("Calling external API:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        throw new Error(`Icona API returned ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching rooms from Icona API:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });
  app2.post("/livekit/token", async (req, res) => {
    try {
      const { room: roomId, userId: clientUserId, userName } = req.body;
      console.log("\u{1F511} Request body received:", req.body);
      if (!req.session?.user) {
        console.error("\u274C Unauthorized: No session user");
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!req.session?.accessToken) {
        console.error("\u274C No access token in session");
        return res.status(401).json({ error: "Authentication required" });
      }
      const sessionUser = req.session.user;
      const userId = sessionUser._id || sessionUser.id;
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.session.accessToken}`
      };
      const roomResponse = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        method: "GET",
        headers
      });
      if (!roomResponse.ok) {
        console.error("\u274C Failed to fetch room details");
        return res.status(404).json({ error: "Room not found" });
      }
      const room = await roomResponse.json();
      const rawOwnerId = room.owner?._id || room.owner?.id;
      const showOwnerId = String(rawOwnerId);
      const normalizedUserId = String(userId);
      const isHost = normalizedUserId === showOwnerId;
      const role = isHost ? "host" : "audience";
      console.log("\u{1F510} Role determination:", {
        userId: normalizedUserId,
        showOwnerId,
        isHost,
        role
      });
      const requestBody = {
        room: roomId,
        userId: clientUserId || userId,
        userName,
        role
      };
      console.log("\u{1F4E4} Sending to external API:", requestBody);
      const response = await fetch(`${BASE_URL}/livekit/token`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`\u274C Icona API returned ${response.status}:`, errorText);
        return res.status(response.status).json({
          error: errorText || "Failed to get LiveKit token from external API"
        });
      }
      const data = await response.json();
      console.log("\u2705 LiveKit token received from Icona API");
      res.json({
        ...data,
        role
      });
    } catch (error) {
      console.error("\u274C Error proxying LiveKit token request:", error);
      res.status(500).json({ error: "Failed to get LiveKit token" });
    }
  });
}

// ../shared-backend/server/routes/shipping.ts
import fetch4 from "node-fetch";
import https from "https";
import { URL } from "url";

// ../shared-backend/shared/schema.ts
import { z as z2 } from "zod";
var loginSchema = z2.object({
  email: z2.string().email("Please enter a valid email address"),
  password: z2.string().min(1, "Password is required")
});
var signupSchema = z2.object({
  email: z2.string().email("Please enter a valid email address"),
  password: z2.string().min(6, "Password must be at least 6 characters"),
  firstName: z2.string().min(1, "First name is required"),
  lastName: z2.string().min(1, "Last name is required"),
  userName: z2.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  phone: z2.string().optional().refine((phone) => {
    if (!phone || phone === "") return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$|^[\+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  }, "Please enter a valid phone number"),
  country: z2.string().min(1, "Country is required")
});
var socialAuthSchema = z2.object({
  email: z2.string().optional(),
  // Apple might not provide email initially
  firstName: z2.string().optional(),
  // Apple might not provide name initially
  lastName: z2.string().optional(),
  type: z2.enum(["google", "apple"], { errorMap: () => ({ message: "Auth type must be 'google' or 'apple'" }) }),
  profilePhoto: z2.string().optional(),
  userName: z2.string().optional(),
  country: z2.string().optional(),
  phone: z2.string().optional(),
  gender: z2.string().optional(),
  uid: z2.string().optional(),
  // Firebase UID (will be overridden by verified UID)
  idToken: z2.string().min(1, "Firebase ID token is required for authentication"),
  // Required for verification
  provider: z2.string().optional(),
  // Firebase provider info
  profilePicture: z2.string().optional()
  // Profile picture URL
}).refine((data) => {
  if (data.type === "google") {
    return !!data.email && !!data.firstName;
  }
  return true;
}, {
  message: "Google authentication requires email and first name",
  path: ["firstName"]
});
var socialAuthCompleteSchema = z2.object({
  firstName: z2.string().min(1, "First name is required"),
  lastName: z2.string().min(1, "Last name is required"),
  userName: z2.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  country: z2.string().min(1, "Country is required"),
  phone: z2.string().optional().refine((phone) => {
    if (!phone || phone === "") return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$|^[\+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  }, "Please enter a valid phone number"),
  gender: z2.string().optional()
});
var authResponseSchema = z2.object({
  token: z2.string().optional(),
  user: z2.object({
    id: z2.string(),
    email: z2.string(),
    name: z2.string().optional()
  }).optional(),
  message: z2.string().optional()
});
var iconaAuthResponseSchema = z2.object({
  success: z2.boolean(),
  message: z2.string().optional(),
  data: z2.any(),
  // User data from Icona API
  accessToken: z2.string().optional(),
  authtoken: z2.string().optional(),
  // Also returned by API
  newuser: z2.boolean().optional()
  // For signup responses
});
var iconaApiErrorResponseSchema = z2.object({
  success: z2.boolean().optional(),
  message: z2.string(),
  error: z2.string().optional(),
  details: z2.any().optional()
});
var iconaOrderSchema = z2.object({
  _id: z2.string(),
  customer: z2.object({
    _id: z2.string(),
    firstName: z2.string(),
    lastName: z2.string().optional(),
    userName: z2.string().optional(),
    email: z2.string(),
    profilePhoto: z2.string().optional(),
    address: z2.object({
      _id: z2.string(),
      name: z2.string(),
      addrress1: z2.string(),
      city: z2.string(),
      state: z2.string(),
      zipcode: z2.string(),
      phone: z2.string(),
      email: z2.string()
    }).optional()
  }),
  seller: z2.object({
    _id: z2.string(),
    firstName: z2.string(),
    lastName: z2.string().optional(),
    userName: z2.string().optional(),
    email: z2.string()
  }),
  need_label: z2.boolean(),
  giveaway: z2.object({
    _id: z2.string(),
    name: z2.string(),
    description: z2.string().optional(),
    quantity: z2.number(),
    images: z2.array(z2.string()).optional(),
    category: z2.object({
      _id: z2.string(),
      name: z2.string()
    }).optional(),
    shipping_profile: z2.object({
      _id: z2.string(),
      weight: z2.number(),
      name: z2.string(),
      scale: z2.string()
    }).optional(),
    height: z2.string().optional(),
    width: z2.string().optional(),
    length: z2.string().optional(),
    status: z2.string().optional(),
    participants: z2.array(z2.string()).optional()
  }).optional(),
  // Order type and items
  ordertype: z2.string().optional(),
  items: z2.array(z2.object({
    _id: z2.string().optional(),
    orderId: z2.string().optional(),
    productId: z2.object({
      _id: z2.string().optional(),
      name: z2.string().optional(),
      images: z2.array(z2.string()).optional(),
      category: z2.object({
        _id: z2.string().optional(),
        name: z2.string().optional()
      }).optional()
    }).optional(),
    quantity: z2.number().optional(),
    price: z2.number().optional(),
    shipping_fee: z2.number().optional(),
    weight: z2.string().optional(),
    height: z2.string().optional(),
    width: z2.string().optional(),
    length: z2.string().optional(),
    scale: z2.string().optional()
  })).optional(),
  // Financial fields
  total: z2.number().optional(),
  // Items total/subtotal amount
  servicefee: z2.number().optional(),
  tax: z2.number().optional(),
  shipping_fee: z2.number().optional(),
  seller_shipping_fee_pay: z2.number().optional(),
  // Seller's shipping cost (always use this for total shipping)
  total_shipping_cost: z2.number().optional(),
  // Total shipping cost for bundle
  invoice: z2.number().optional(),
  // Status and tracking
  status: z2.string().optional(),
  tracking_number: z2.string().optional(),
  label: z2.string().optional(),
  weight: z2.union([z2.number(), z2.string()]).optional(),
  // Order weight
  // Dates  
  date: z2.number().optional(),
  createdAt: z2.string().optional(),
  updatedAt: z2.string().optional(),
  // Bundling
  bundleId: z2.string().optional().nullable(),
  // Show/Room association
  tokshow: z2.object({
    _id: z2.string(),
    title: z2.string().optional(),
    name: z2.string().optional()
  }).optional(),
  height: z2.string().optional(),
  width: z2.string().optional(),
  length: z2.string().optional(),
  scale: z2.string().optional()
});
var iconaOrdersResponseSchema = z2.object({
  orders: z2.array(iconaOrderSchema),
  limits: z2.number(),
  pages: z2.number(),
  total: z2.number()
});
var iconaDashboardResponseSchema = z2.object({
  totalOrder: z2.number(),
  totalAmount: z2.string(),
  todayOrder: z2.array(z2.any()),
  totalAmountOfThisMonth: z2.string(),
  totalPendingOrder: z2.object({
    total: z2.number(),
    count: z2.number()
  }).optional(),
  totalDeliveredOrder: z2.number(),
  orders: z2.array(z2.any()),
  weeklySaleReport: z2.array(z2.any())
});
var iconaProductSchema = z2.object({
  _id: z2.string(),
  name: z2.string(),
  description: z2.string().optional(),
  price: z2.number(),
  quantity: z2.number(),
  images: z2.array(z2.string()).optional(),
  category: z2.object({
    _id: z2.string(),
    name: z2.string()
  }).optional(),
  seller: z2.object({
    _id: z2.string(),
    firstName: z2.string(),
    lastName: z2.string().optional(),
    userName: z2.string().optional(),
    email: z2.string()
  }),
  status: z2.string().optional(),
  weight: z2.union([z2.number(), z2.string()]).optional(),
  height: z2.string().optional(),
  width: z2.string().optional(),
  length: z2.string().optional(),
  scale: z2.string().optional(),
  shipping_profile: z2.object({
    _id: z2.string(),
    weight: z2.number(),
    name: z2.string(),
    scale: z2.string()
  }).optional(),
  colors: z2.array(z2.string()).optional(),
  sizes: z2.array(z2.string()).optional(),
  featured: z2.boolean().optional(),
  createdAt: z2.string().optional(),
  updatedAt: z2.string().optional()
});
var iconaProductsResponseSchema = z2.object({
  products: z2.array(iconaProductSchema),
  limits: z2.number(),
  pages: z2.number(),
  totalDoc: z2.number()
});
var iconaCategorySchema = z2.lazy(() => z2.object({
  _id: z2.string(),
  name: z2.string(),
  description: z2.string().optional(),
  status: z2.string().optional(),
  icon: z2.string().optional(),
  type: z2.string().optional(),
  subCategories: z2.array(iconaCategorySchema).optional()
}));
var iconaCategoriesResponseSchema = z2.object({
  categories: z2.array(iconaCategorySchema),
  limits: z2.number().optional(),
  pages: z2.number().optional(),
  total: z2.number().optional()
});
var iconaShippingProfileSchema = z2.object({
  _id: z2.string(),
  name: z2.string(),
  weight: z2.number(),
  scale: z2.string(),
  description: z2.string().optional()
});
var iconaShippingProfilesResponseSchema = z2.array(iconaShippingProfileSchema);
var listingTypeSchema = z2.enum(["auction", "buy_now", "giveaway"]);
var productFormSchema = z2.object({
  name: z2.string().min(1, "Product name is required"),
  description: z2.string().optional(),
  price: z2.coerce.number().optional().nullable(),
  quantity: z2.coerce.number({ invalid_type_error: "Quantity is required" }).int().min(1, "Quantity must be at least 1"),
  category: z2.string().min(1, "Category is required"),
  status: z2.enum(["active", "inactive", "out_of_stock", "draft"]).optional().default("active"),
  listingType: listingTypeSchema,
  shippingProfile: z2.string().nullable().optional(),
  images: z2.array(z2.string()).optional(),
  // Auction-specific fields
  startingPrice: z2.coerce.number().optional().nullable(),
  duration: z2.coerce.number().int().optional().nullable(),
  sudden: z2.boolean().optional().default(false),
  // Buy Now-specific fields
  featured: z2.boolean().optional().default(false),
  // Giveaway-specific fields
  whocanenter: z2.enum(["everyone", "followers"]).optional().default("everyone"),
  // Room association
  tokshow: z2.string().optional()
}).refine((data) => {
  if (data.listingType === "auction") {
    return data.startingPrice !== void 0 && data.startingPrice !== null && data.startingPrice > 0;
  }
  return true;
}, {
  message: "Starting price must be greater than 0",
  path: ["startingPrice"]
}).refine((data) => {
  if (data.listingType === "auction") {
    return data.duration !== void 0 && data.duration !== null && data.duration > 0;
  }
  return true;
}, {
  message: "Duration must be selected",
  path: ["duration"]
}).refine((data) => {
  if (data.listingType === "buy_now") {
    return data.price !== void 0 && data.price !== null && data.price > 0;
  }
  return true;
}, {
  message: "Price must be greater than 0",
  path: ["price"]
});
var bundleSchema = z2.object({
  id: z2.string(),
  // Generated hash from sorted orderIds
  customerId: z2.string(),
  customerName: z2.string(),
  orderIds: z2.array(z2.string()),
  count: z2.number(),
  weight: z2.string().optional(),
  // Aggregated weight
  dimensions: z2.string().optional(),
  // Aggregated dimensions  
  totalValue: z2.number(),
  // Sum of order totals
  status: z2.enum(["pending", "labeled"]).optional().default("pending"),
  createdAt: z2.string().optional()
});
var createAddressSchema = z2.object({
  name: z2.string().min(1, "Address name is required"),
  addrress1: z2.string().min(1, "Street address is required"),
  // Keep typo as in original schema
  addrress2: z2.string().optional().default(""),
  city: z2.string().min(1, "City is required"),
  state: z2.string().min(1, "State is required"),
  stateCode: z2.string().optional().default(""),
  // Add state code
  cityCode: z2.string().optional().default(""),
  // Add city code (may not always be available)
  zipcode: z2.string().min(1, "ZIP code is required"),
  countryCode: z2.string().min(1, "Country is required"),
  country: z2.string().optional(),
  phone: z2.string().min(1, "Phone number is required"),
  email: z2.string().email("Please enter a valid email address"),
  userId: z2.string().min(1, "User ID is required")
});
var updateAddressSchema = createAddressSchema.partial().extend({
  name: z2.string().min(1, "Address name is required").optional(),
  addrress1: z2.string().min(1, "Street address is required").optional(),
  city: z2.string().min(1, "City is required").optional(),
  state: z2.string().min(1, "State is required").optional(),
  zipcode: z2.string().min(1, "ZIP code is required").optional(),
  countryCode: z2.string().min(1, "Country is required").optional(),
  phone: z2.string().min(1, "Phone number is required").optional(),
  email: z2.string().email("Please enter a valid email address").optional()
});
var makePrimaryAddressSchema = z2.object({
  primary: z2.boolean(),
  userId: z2.string().min(1, "User ID is required")
});
var shippingEstimateRequestSchema = z2.object({
  weight: z2.union([z2.string(), z2.number()]).transform(String),
  unit: z2.string().optional().default("oz"),
  product: z2.string(),
  update: z2.boolean().optional().default(true),
  owner: z2.string(),
  customer: z2.string(),
  length: z2.union([z2.string(), z2.number()]).transform(Number),
  width: z2.union([z2.string(), z2.number()]).transform(Number),
  height: z2.union([z2.string(), z2.number()]).transform(Number)
});
var shippingEstimateResponseSchema = z2.object({
  carrier: z2.string(),
  service: z2.string(),
  price: z2.string(),
  deliveryTime: z2.string(),
  objectId: z2.string().min(1, "Rate ID is required")
  // Rate ID from external API
});
var shippingLabelPurchaseRequestSchema = z2.object({
  rate_id: z2.string().min(1, "Rate ID is required"),
  order: z2.union([z2.string(), z2.object({
    _id: z2.string(),
    customer: z2.object({
      _id: z2.string(),
      firstName: z2.string(),
      lastName: z2.string().optional(),
      email: z2.string().email(),
      address: z2.object({
        name: z2.string(),
        addrress1: z2.string(),
        city: z2.string(),
        state: z2.string(),
        zipcode: z2.string(),
        phone: z2.string(),
        email: z2.string().email()
      }).optional()
    }),
    seller: z2.object({
      _id: z2.string(),
      firstName: z2.string(),
      lastName: z2.string().optional(),
      email: z2.string().email()
    })
  })]),
  isBundle: z2.boolean().optional(),
  // Add explicit bundle flag
  shipping_fee: z2.union([z2.string(), z2.number()]).transform(Number),
  servicelevel: z2.string().min(1, "Service level is required"),
  carrier: z2.string().optional(),
  deliveryTime: z2.string().optional()
});
var shippingLabelPurchaseResponseSchema = z2.object({
  success: z2.boolean(),
  message: z2.string(),
  data: z2.object({
    tracking_number: z2.string(),
    label_url: z2.string().optional(),
    label_data: z2.string().optional(),
    // Base64 encoded label
    carrier: z2.string(),
    service: z2.string(),
    cost: z2.string(),
    delivery_time: z2.string(),
    purchased_at: z2.string()
  }).optional(),
  error: z2.string().optional()
});
var bundleLabelPurchaseRequestSchema = z2.object({
  orderIds: z2.array(z2.string().min(1, "Order ID cannot be empty")).min(1, "At least one order ID is required"),
  service: z2.string().min(1, "Service level is required").optional().default("Ground Advantage"),
  rate_id: z2.string().min(1, "Rate ID is required")
});
var bundleLabelPurchaseResponseSchema = z2.object({
  success: z2.boolean(),
  message: z2.string(),
  data: z2.object({
    tracking_number: z2.string(),
    label_url: z2.string().optional(),
    cost: z2.number(),
    carrier: z2.string(),
    service: z2.string(),
    affected_orders: z2.array(z2.string()),
    update_results: z2.array(z2.object({
      orderId: z2.string(),
      success: z2.boolean(),
      error: z2.string().optional(),
      data: z2.any().optional()
    })),
    aggregated_weight: z2.string().optional(),
    aggregated_dimensions: z2.string().optional()
  }).optional(),
  error: z2.string().optional()
});

// ../shared-backend/server/routes/shipping.ts
function makeGetWithBody(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const body = JSON.stringify(payload);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body).toString(),
        ...headers
      },
      timeout: 15e3
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });
    req.on("error", (error) => {
      reject(error);
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.write(body);
    req.end();
  });
}
function registerShippingRoutes(app2) {
  app2.get("/api/shipping/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Proxying shipping profiles request to Icona API for user:", userId);
      const url = `${BASE_URL}/shipping/profiles/${userId}`;
      console.log("Final API URL being called:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch4(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Shipping profiles proxy error:", error);
      res.status(500).json({ error: "Failed to fetch shipping profiles from Icona API" });
    }
  });
  app2.post("/api/shipping/profiles/:id", async (req, res) => {
    try {
      const { id: userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      console.log("Creating shipping profile via Icona API for user:", userId);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch4(`${BASE_URL}/shipping/profiles/${userId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Create shipping profile error:", error);
      res.status(500).json({ error: "Failed to create shipping profile" });
    }
  });
  app2.put("/api/shipping/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Updating shipping profile via Icona API:", id);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch4(`${BASE_URL}/shipping/profiles/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Update shipping profile error:", error);
      res.status(500).json({ error: "Failed to update shipping profile" });
    }
  });
  app2.delete("/api/shipping/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Deleting shipping profile via Icona API:", id);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch4(`${BASE_URL}/shipping/profiles/${id}`, {
        method: "DELETE",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delete shipping profile error:", error);
      res.status(500).json({ error: "Failed to delete shipping profile" });
    }
  });
  app2.get("/api/shipping/metrics", async (req, res) => {
    try {
      const { userId, customer } = req.query;
      if (!userId && !customer) {
        return res.status(400).json({ error: "userId or customer parameter is required" });
      }
      const queryParams = new URLSearchParams();
      if (customer) {
        queryParams.set("customer", customer);
      } else if (userId) {
        queryParams.set("userId", userId);
      }
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch4(`${BASE_URL}/orders?${queryParams.toString()}`, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(`External API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const orders = data.orders || [];
      const totalSoldFromItems = orders.reduce((sum, order) => {
        const itemsSubtotal = order.items ? order.items.reduce((itemSum, item) => {
          const quantity = item.quantity || 0;
          const price = item.price || 0;
          return itemSum + quantity * price;
        }, 0) : 0;
        const tax = order.tax || 0;
        const itemsTotal = itemsSubtotal + tax;
        return sum + itemsTotal;
      }, 0);
      const totalShippingCosts = orders.reduce((sum, order) => sum + (order.shipping_fee || 0), 0);
      const totalServiceFees = orders.reduce((sum, order) => sum + (order.servicefee || 0), 0);
      const totalShippingSpend = orders.filter((order) => order.status === "processing").reduce((sum, order) => sum + (order.seller_shipping_fee_pay || 0), 0);
      const totalCouponSpend = 0;
      const totalEarned = totalSoldFromItems - totalShippingSpend - totalServiceFees - totalCouponSpend;
      const itemsSold = orders.reduce((sum, order) => {
        const itemCount = order.items ? order.items.reduce((total, item) => total + (item.quantity || 1), 0) : 1;
        return sum + itemCount;
      }, 0);
      const totalDelivered = orders.filter((order) => order.status === "delivered" || order.status === "ended").length;
      const pendingDelivery = orders.filter((order) => order.status === "shipping" || order.status === "shipped").length;
      const metrics = {
        totalSold: totalSoldFromItems.toFixed(2),
        totalEarned: totalEarned.toFixed(2),
        totalShippingSpend: totalShippingSpend.toFixed(2),
        totalCouponSpend: totalCouponSpend.toFixed(2),
        itemsSold,
        totalDelivered,
        pendingDelivery
      };
      res.json(metrics);
    } catch (error) {
      console.error("Shipping metrics error:", error);
      res.status(500).json({ error: "Failed to fetch shipping metrics" });
    }
  });
  app2.post("/api/shipping/estimate", async (req, res) => {
    try {
      console.log("Fetching shipping estimate for auction:", req.body);
      const requestBody = {
        weight: req.body.weight,
        unit: req.body.unit,
        product: req.body.product,
        update: req.body.update,
        owner: req.body.owner,
        customer: req.body.customer,
        tokshow: req.body.tokshow,
        buying_label: true
      };
      const estimate = await makeGetWithBody(`${BASE_URL}/shipping/profiles/estimate/rates`, requestBody);
      console.log("Shipping estimate response:", estimate);
      res.json(estimate);
    } catch (error) {
      console.error("Shipping estimate error:", error);
      res.status(500).json({ error: "Failed to get shipping estimate" });
    }
  });
  app2.post("/api/shipping/profiles/estimate/rates", async (req, res) => {
    try {
      const validatedData = shippingEstimateRequestSchema.parse(req.body);
      console.log("Fetching shipping estimates from external API:", `${BASE_URL}/shipping/profiles/estimate/rates`);
      const requestBody = {
        weight: validatedData.weight,
        unit: validatedData.unit,
        product: validatedData.product,
        update: validatedData.update,
        owner: validatedData.owner,
        customer: validatedData.customer,
        length: validatedData.length,
        width: validatedData.width,
        height: validatedData.height,
        buying_label: true
      };
      const rawEstimate = await makeGetWithBody(`${BASE_URL}/shipping/profiles/estimate/rates`, requestBody);
      console.log("External API shipping estimates:", rawEstimate);
      const estimates = Array.isArray(rawEstimate) ? rawEstimate : [rawEstimate];
      const transformedEstimates = estimates.map((estimate) => {
        const transformed = {
          // Include original data for reference first
          ...estimate,
          // Then override with normalized fields
          carrier: estimate.provider || "Unknown",
          service: estimate.servicelevel?.name || "Standard",
          price: estimate.amount || "0.00",
          deliveryTime: estimate.durationTerms || "Standard delivery",
          estimatedDays: estimate.estimatedDays || 3,
          objectId: typeof estimate.objectId === "string" ? estimate.objectId.trim() : ""
        };
        try {
          shippingEstimateResponseSchema.parse(transformed);
          return transformed;
        } catch (validationError) {
          console.error("Invalid estimate response - missing objectId:", estimate);
          return null;
        }
      }).filter(Boolean);
      if (transformedEstimates.length === 0) {
        return res.status(500).json({
          error: "No valid shipping estimates available",
          message: "Unable to get valid shipping rates. Please check package details and try again."
        });
      }
      res.json(transformedEstimates);
    } catch (error) {
      console.error("Shipping estimates error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return res.status(400).json({
          error: "Invalid shipping data",
          message: "Missing or invalid weight/dimensions data",
          details: error.message
        });
      }
      res.status(500).json({
        error: "Failed to calculate shipping estimates",
        message: "Unable to calculate shipping costs. Please check package details."
      });
    }
  });
  app2.post("/api/shipping/profiles/buy/label", async (req, res) => {
    try {
      const validatedData = shippingLabelPurchaseRequestSchema.parse(req.body);
      console.log("Processing shipping label purchase:", {
        rate_id: validatedData.rate_id,
        order: validatedData.order,
        carrier: validatedData.carrier,
        servicelevel: validatedData.servicelevel,
        shipping_fee: validatedData.shipping_fee,
        label_file_type: req.body.label_file_type
      });
      const fetchHeaders = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        fetchHeaders["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      let orderIdToSend = validatedData.order;
      try {
        const orderResponse = await fetch4(`${BASE_URL}/orders/${validatedData.order}`, {
          method: "GET",
          headers: fetchHeaders
        });
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          if (orderData && orderData.bundleId) {
            orderIdToSend = orderData.bundleId;
            console.log(`Order ${validatedData.order} belongs to bundle ${orderData.bundleId}, using bundle ID`);
          }
        } else {
          console.log(`Could not fetch order ${validatedData.order} (might already be a bundle ID), using as-is`);
        }
      } catch (fetchError) {
        console.log(`Error fetching order ${validatedData.order}, using order ID as provided:`, fetchError);
      }
      const rates = [{
        rate_id: validatedData.rate_id,
        label_file_type: req.body.label_file_type || "PDF_4x6",
        order: orderIdToSend
      }];
      console.log("Calling external shipping API:", `${BASE_URL}/shipping/profiles/buy/label`);
      console.log("Request body being sent to external API:", { rates });
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch4(`${BASE_URL}/shipping/profiles/buy/label`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rates })
      });
      console.log(`External API response: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("External API error response:", errorText);
        let errorMessage = "Failed to purchase label";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        return res.status(response.status).json({
          success: false,
          message: errorMessage,
          error: errorText
        });
      }
      const apiResponseData = await response.json();
      console.log("External API response data:", apiResponseData);
      const result = apiResponseData.results?.[0];
      if (!result) {
        return res.status(500).json({
          success: false,
          message: "No label data returned from API"
        });
      }
      const transformedResponse = {
        success: true,
        data: {
          tracking_number: result.tracking_number || "",
          cost: validatedData.shipping_fee.toString(),
          carrier: validatedData.carrier || "Unknown",
          service: validatedData.servicelevel || "Standard",
          label_url: result.label || "",
          delivery_time: "Standard delivery",
          purchased_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        message: "Label purchased successfully"
      };
      res.status(200).json(transformedResponse);
    } catch (error) {
      console.error("Shipping label purchase error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid request data for label purchase",
          error: error.message
        });
      }
      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          message: "Failed to purchase shipping label",
          error: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred while purchasing the shipping label",
        error: "Internal server error"
      });
    }
  });
  app2.post("/api/shipping/labels/bundle", async (req, res) => {
    try {
      const validatedData = bundleLabelPurchaseRequestSchema.parse(req.body);
      const { orderIds, service, rate_id } = validatedData;
      console.log("Processing bundle label purchase for orders:", orderIds);
      const fetchHeaders = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        fetchHeaders["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const orderFetchPromises = orderIds.map(async (orderId) => {
        const response2 = await fetch4(`${BASE_URL}/orders/${orderId}`, {
          method: "GET",
          headers: fetchHeaders
        });
        if (!response2.ok) {
          throw new Error(`Failed to fetch order ${orderId}: ${response2.status} ${response2.statusText}`);
        }
        return response2.json();
      });
      const orders = await Promise.all(orderFetchPromises);
      console.log(`Fetched ${orders.length} orders for bundling`);
      const firstOrder = orders[0];
      const customerId = firstOrder.customer._id;
      const customerAddress = firstOrder.customer.address;
      if (!customerAddress) {
        return res.status(400).json({
          success: false,
          message: "First order has no shipping address",
          error: "Cannot bundle orders without shipping address"
        });
      }
      for (const order of orders) {
        if (order.customer._id !== customerId) {
          return res.status(400).json({
            success: false,
            message: "All orders must belong to the same customer",
            error: `Order ${order._id} belongs to different customer`
          });
        }
        const orderAddress = order.customer.address;
        if (!orderAddress || orderAddress.addrress1 !== customerAddress.addrress1 || orderAddress.city !== customerAddress.city || orderAddress.state !== customerAddress.state || orderAddress.zipcode !== customerAddress.zipcode) {
          return res.status(400).json({
            success: false,
            message: "All orders must have the same shipping address",
            error: `Order ${order._id} has different shipping address`
          });
        }
        const validStatuses = ["pending", "processing", "unfulfilled", "ready_to_ship"];
        if (order.status && !validStatuses.includes(order.status)) {
          return res.status(400).json({
            success: false,
            message: `Order ${order._id} has incompatible status: ${order.status}`,
            error: "Orders must have compatible status for bundling"
          });
        }
      }
      let totalWeightOz = 0;
      let maxLength = 0;
      let maxWidth = 0;
      let totalHeight = 0;
      for (const order of orders) {
        let orderWeight = 0;
        if (order.giveaway?.shipping_profile?.weight) {
          const weight = order.giveaway.shipping_profile.weight;
          const scale = order.giveaway.shipping_profile.scale?.toLowerCase() || "oz";
          orderWeight = scale === "lb" ? weight * 16 : weight;
        } else if (order.items) {
          for (const item of order.items) {
            if (item.weight) {
              const itemWeight = parseFloat(item.weight);
              const itemScale = item.scale?.toLowerCase() || "oz";
              const weightInOz = itemScale === "lb" ? itemWeight * 16 : itemWeight;
              orderWeight += weightInOz * (item.quantity || 1);
            }
          }
        }
        totalWeightOz += orderWeight;
        let orderLength = 0, orderWidth = 0, orderHeight = 0;
        if (order.giveaway) {
          orderLength = parseFloat(order.giveaway.length || "0");
          orderWidth = parseFloat(order.giveaway.width || "0");
          orderHeight = parseFloat(order.giveaway.height || "0");
        } else if (order.items && order.items.length > 0) {
          const firstItem = order.items[0];
          orderLength = parseFloat(firstItem.length || "0");
          orderWidth = parseFloat(firstItem.width || "0");
          orderHeight = parseFloat(firstItem.height || "0");
        }
        maxLength = Math.max(maxLength, orderLength);
        maxWidth = Math.max(maxWidth, orderWidth);
        totalHeight += orderHeight;
      }
      if (maxLength === 0) maxLength = 12;
      if (maxWidth === 0) maxWidth = 12;
      if (totalHeight === 0) totalHeight = 4;
      if (totalWeightOz === 0) totalWeightOz = 8;
      const aggregatedWeight = `${totalWeightOz}`;
      const aggregatedDimensions = `${maxLength}x${maxWidth}x${totalHeight}`;
      console.log("Aggregated parcel data:", {
        weight: `${totalWeightOz} oz`,
        dimensions: aggregatedDimensions,
        orders: orderIds.length
      });
      const aggregateOrder = {
        _id: `bundle_${orderIds.join("_")}`,
        customer: firstOrder.customer,
        seller: firstOrder.seller,
        items: orderIds.map((id) => ({ _id: id, bundled: true }))
      };
      const estimatedCost = Math.max(5.99, totalWeightOz * 0.15);
      const bundleId = `bundle_${orderIds.join("_")}`;
      const rates = [{
        rate_id,
        label_file_type: "PDF_4x6",
        // Default format for bundles
        order: bundleId
      }];
      console.log("Creating bundle label with Icona API");
      console.log("Bundle request:", { rates });
      const labelHeaders = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        labelHeaders["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const labelResponse = await fetch4(`${BASE_URL}/shipping/profiles/buy/label`, {
        method: "POST",
        headers: labelHeaders,
        body: JSON.stringify({ rates })
      });
      if (!labelResponse.ok) {
        const errorText = await labelResponse.text();
        console.error("Bundle label purchase failed:", errorText);
        return res.status(labelResponse.status).json({
          success: false,
          message: `Failed to create bundle label: ${labelResponse.status}`,
          error: errorText
        });
      }
      const labelResult = await labelResponse.json();
      console.log("Bundle label created successfully:", labelResult);
      const result = labelResult.results?.[0];
      const trackingNumber = result?.tracking_number;
      const labelUrl = result?.label;
      if (!trackingNumber) {
        return res.status(500).json({
          success: false,
          message: "Label created but no tracking number received",
          error: "Missing tracking number in API response"
        });
      }
      console.log(`Updating ${orderIds.length} orders with tracking number: ${trackingNumber}`);
      const updateHeaders = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        updateHeaders["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const updatePromises = orderIds.map(async (orderId) => {
        try {
          const updateResponse = await fetch4(`${BASE_URL}/orders/${orderId}`, {
            method: "PATCH",
            headers: updateHeaders,
            body: JSON.stringify({
              tracking_number: trackingNumber,
              label_url: labelUrl,
              // Use correct field name
              status: "ready_to_ship"
            })
          });
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`Failed to update order ${orderId}:`, updateResponse.status, errorText);
            return {
              orderId,
              success: false,
              error: `HTTP ${updateResponse.status}: ${errorText}`
            };
          }
          const updatedOrder = await updateResponse.json();
          console.log(`Order ${orderId} updated with tracking number`);
          return { orderId, success: true, data: updatedOrder };
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
          return {
            orderId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      });
      const updateResults = await Promise.all(updatePromises);
      const failedUpdates = updateResults.filter((result2) => !result2.success);
      const successfulUpdates = updateResults.filter((result2) => result2.success);
      console.log(`Bundle label results: ${successfulUpdates.length} successful, ${failedUpdates.length} failed`);
      let responseStatus = 200;
      let message = `Bundle label created successfully for ${orderIds.length} orders`;
      if (failedUpdates.length > 0) {
        if (successfulUpdates.length === 0) {
          responseStatus = 500;
          message = "Label created but failed to update any orders";
        } else {
          responseStatus = 207;
          message = `Label created with partial success: ${successfulUpdates.length}/${orderIds.length} orders updated`;
        }
      }
      const response = {
        success: failedUpdates.length === 0,
        message,
        data: {
          tracking_number: trackingNumber,
          label_url: labelUrl,
          cost: estimatedCost,
          carrier: "USPS",
          service,
          affected_orders: orderIds,
          update_results: updateResults,
          aggregated_weight: aggregatedWeight,
          aggregated_dimensions: aggregatedDimensions
        }
      };
      res.status(responseStatus).json(response);
    } catch (error) {
      console.error("Bundle label purchase error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid bundle label request data",
          error: error.message
        });
      }
      const errorResponse = {
        success: false,
        message: "Failed to purchase bundle label",
        error: error instanceof Error ? error.message : "Internal server error"
      };
      res.status(500).json(errorResponse);
    }
  });
  app2.post("/api/shipping/bulk-labels", async (req, res) => {
    try {
      const { orderIds, labelFileType, userId } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid orderIds: must be a non-empty array"
        });
      }
      if (!labelFileType) {
        return res.status(400).json({
          success: false,
          message: "labelFileType is required"
        });
      }
      console.log(`Processing bulk label purchase for ${orderIds.length} orders with format: ${labelFileType}`);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const rates = [];
      const fetchErrors = [];
      for (const orderId of orderIds) {
        try {
          const orderResponse = await fetch4(`${BASE_URL}/orders/?_id=${orderId}`, {
            method: "GET",
            headers
          });
          if (!orderResponse.ok) {
            fetchErrors.push(`Failed to fetch order ${orderId}`);
            continue;
          }
          const orderData = await orderResponse.json();
          const order = orderData.orders?.[0] || orderData.data?.orders?.[0];
          if (!order) {
            fetchErrors.push(`Order ${orderId} not found`);
            continue;
          }
          if (!order.rate_id) {
            fetchErrors.push(`Order ${orderId} has no rate_id`);
            continue;
          }
          rates.push({
            rate_id: order.rate_id,
            label_file_type: labelFileType,
            order: orderId
          });
        } catch (error) {
          fetchErrors.push(
            error instanceof Error ? error.message : `Unknown error for order ${orderId}`
          );
        }
      }
      if (rates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid orders found to purchase labels",
          errors: fetchErrors
        });
      }
      console.log(`Sending bulk label request with ${rates.length} rates`);
      console.log("Rates being sent:", JSON.stringify(rates, null, 2));
      console.log("API URL:", `${BASE_URL}/shipping/profiles/buy/label`);
      const labelResponse = await fetch4(`${BASE_URL}/shipping/profiles/buy/label`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rates })
      });
      console.log("Label API response status:", labelResponse.status);
      if (!labelResponse.ok) {
        const errorText = await labelResponse.text();
        let errorMessage = "Failed to purchase labels";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        return res.status(labelResponse.status).json({
          success: false,
          message: errorMessage
        });
      }
      const labelData = await labelResponse.json();
      console.log("Label API response data:", JSON.stringify(labelData, null, 2));
      return res.json({
        success: true,
        message: `Successfully purchased ${rates.length} labels`,
        data: labelData,
        fetchErrors: fetchErrors.length > 0 ? fetchErrors : void 0
      });
    } catch (error) {
      console.error("Bulk label purchase error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to process bulk label purchase"
      });
    }
  });
}

// ../shared-backend/server/routes/bundles.ts
import fetch5 from "node-fetch";
function registerBundleRoutes(app2) {
  app2.get("/api/bundles", async (req, res) => {
    try {
      console.log("Fetching bundles from orders with assigned bundle IDs");
      console.log("Query params received:", req.query);
      const queryParams = new URLSearchParams();
      if (req.query.userId) {
        queryParams.set("userId", req.query.userId);
      } else if (req.query.customer) {
        queryParams.set("customer", req.query.customer);
      } else {
        return res.status(400).json({ error: "userId or customer parameter is required" });
      }
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/orders${queryString ? "?" + queryString : ""}`;
      console.log("Fetching orders from Icona API:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch5(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const orders = data.orders || [];
      console.log(`Found ${orders.length} orders, filtering by bundle IDs...`);
      const bundledOrders = orders.filter((order) => {
        return order && order.bundleId && order.bundleId.trim() !== "";
      });
      console.log(`Found ${bundledOrders.length} orders with bundle IDs`);
      const bundleGroups = /* @__PURE__ */ new Map();
      bundledOrders.forEach((order) => {
        const bundleId = order.bundleId;
        if (!bundleGroups.has(bundleId)) {
          bundleGroups.set(bundleId, []);
        }
        bundleGroups.get(bundleId).push(order);
      });
      const bundles = Array.from(bundleGroups.entries()).map(([bundleId, orders2]) => {
        const totalValue = orders2.reduce((sum, order) => sum + (order.total || 0), 0);
        const weights = orders2.map((order) => {
          if (order.giveaway?.shipping_profile?.weight) {
            return order.giveaway.shipping_profile.weight;
          }
          if (order.items?.length) {
            return order.items.reduce((sum, item) => {
              const weight = parseFloat(item.weight || "0");
              return sum + (isNaN(weight) ? 0 : weight);
            }, 0);
          }
          return 0;
        }).filter((w) => w > 0);
        const totalWeight = weights.length > 0 ? weights.reduce((sum, w) => sum + w, 0) : 0;
        const firstOrder = orders2[0];
        let customerId;
        let customerName;
        if (typeof firstOrder.customer === "string") {
          customerId = firstOrder.customer;
          customerName = firstOrder.customer;
        } else if (firstOrder.customer && typeof firstOrder.customer === "object") {
          customerId = firstOrder.customer._id || "";
          customerName = `${firstOrder.customer.firstName || ""} ${firstOrder.customer.lastName || ""}`.trim();
        } else {
          customerId = "";
          customerName = "Unknown Customer";
        }
        return {
          id: bundleId,
          customerId,
          customerName,
          orderIds: orders2.map((order) => order._id),
          count: orders2.length,
          weight: totalWeight > 0 ? `${totalWeight} oz` : void 0,
          dimensions: void 0,
          // Could aggregate dimensions if needed
          totalValue,
          status: "pending",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      console.log(`Found ${bundles.length} bundles from ${bundledOrders.length} bundled orders`);
      res.json(bundles);
    } catch (error) {
      console.error("Bundles fetch error:", error);
      res.status(500).json({ error: "Failed to fetch bundles from orders" });
    }
  });
  app2.delete("/api/bundles/:bundleId", async (req, res) => {
    try {
      const { bundleId } = req.params;
      const { orderIds } = req.body || {};
      console.log("Unbundling orders with bundle ID:", bundleId, orderIds ? `(selective: ${orderIds.length} orders)` : "(all orders)");
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: "userId parameter is required" });
      }
      const ordersUrl = `${BASE_URL}/orders?userId=${userId}`;
      const ordersResponse = await fetch5(ordersUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
      }
      const ordersData = await ordersResponse.json();
      const allOrders = ordersData.orders || [];
      let bundledOrders = allOrders.filter((order) => order.bundleId === bundleId);
      if (bundledOrders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No orders found with the specified bundle ID",
          data: { bundleId, ordersFound: 0 }
        });
      }
      if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
        bundledOrders = bundledOrders.filter((order) => orderIds.includes(order._id));
        if (bundledOrders.length === 0) {
          return res.status(404).json({
            success: false,
            message: "None of the specified orders were found in this bundle",
            data: { bundleId, orderIds, ordersFound: 0 }
          });
        }
      }
      console.log(`Found ${bundledOrders.length} orders to unbundle`);
      const unbundleResults = [];
      for (const order of bundledOrders) {
        try {
          console.log(`Removing bundle ID from order ${order._id}`);
          const response = await fetch5(`${BASE_URL}/orders/${order._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ bundleId: null })
          });
          if (response.ok) {
            const updatedOrder = await response.json();
            unbundleResults.push({
              orderId: order._id,
              success: true,
              data: updatedOrder
            });
            console.log(`Successfully removed bundle ID from order ${order._id}`);
          } else {
            const errorText = await response.text();
            console.error(`Failed to remove bundle ID from order ${order._id}:`, response.status, errorText);
            unbundleResults.push({
              orderId: order._id,
              success: false,
              error: `Failed to update: ${response.status} - ${errorText}`
            });
          }
        } catch (error) {
          console.error(`Error updating order ${order._id}:`, error);
          unbundleResults.push({
            orderId: order._id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      const successfulUnbundles = unbundleResults.filter((result) => result.success);
      const failedUnbundles = unbundleResults.filter((result) => !result.success);
      if (successfulUnbundles.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to unbundle any orders",
          data: {
            bundleId,
            results: unbundleResults
          }
        });
      }
      res.json({
        success: true,
        message: `Bundle unbundled successfully. ${successfulUnbundles.length} orders unbundled.`,
        data: {
          bundleId,
          ordersUnbundled: successfulUnbundles.length,
          ordersFailed: failedUnbundles.length,
          results: unbundleResults
        }
      });
    } catch (error) {
      console.error("Unbundle error:", error);
      res.status(500).json({ error: "Failed to unbundle orders" });
    }
  });
}

// ../shared-backend/server/routes/reports.ts
function registerReportRoutes(app2) {
  app2.get("/api/reports/export", async (req, res) => {
    try {
      const { type, startDate, endDate } = req.query;
      res.json({
        message: "Report export initiated",
        type,
        dateRange: { startDate, endDate },
        downloadUrl: `https://example.com/reports/export-${Date.now()}.csv`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export report" });
    }
  });
}

// ../shared-backend/server/routes/auth.ts
import fetch6 from "node-fetch";

// ../shared-backend/server/firebase-admin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
var adminApp;
try {
  const existingApps = getApps();
  if (existingApps.length === 0) {
    const firebaseConfig = {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    };
    adminApp = initializeApp(firebaseConfig);
  } else {
    adminApp = existingApps[0];
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  adminApp = initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });
}
var adminAuth = getAuth(adminApp);
async function verifyFirebaseToken(idToken) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider: decodedToken.firebase.sign_in_provider,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture
    };
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return {
      success: false,
      error: "Invalid or expired Firebase token"
    };
  }
}

// ../shared-backend/server/routes/auth.ts
async function resilientFetch(url, options) {
  console.log(
    `[Resilient Fetch] Requesting: ${options.method || "GET"} ${url}`
  );
  try {
    const response = await fetch6(url, options);
    const contentType = response.headers.get("content-type");
    console.log(
      `[Resilient Fetch] Response: ${response.status} ${response.statusText}`
    );
    console.log(`[Resilient Fetch] Content-Type: ${contentType}`);
    let responseData;
    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error(
          "[Resilient Fetch] Failed to parse JSON response:",
          jsonError
        );
        const textData = await response.text();
        console.error(
          "[Resilient Fetch] Raw response:",
          textData.slice(0, 200)
        );
        throw new Error(`API returned invalid JSON: ${textData.slice(0, 200)}`);
      }
    } else {
      const textData = await response.text();
      console.error(
        `[Resilient Fetch] Non-JSON response received:`,
        textData.slice(0, 200)
      );
      throw new Error(
        `API returned non-JSON response (${contentType}): ${textData.slice(0, 100)}`
      );
    }
    return { response, data: responseData };
  } catch (error) {
    console.error("[Resilient Fetch] Network/Parse error:", error);
    throw error;
  }
}
function registerAuthRoutes(app2) {
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      console.log("Proxying signup request to Icona API");
      console.log("Signup payload received:", {
        ...req.body,
        password: "[REDACTED]"
      });
      const validationResult = signupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const { email, country, firstName, lastName, userName, phone, password } = validationResult.data;
      const { response, data: responseData } = await resilientFetch(
        `${BASE_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            country,
            firstName,
            lastName,
            userName,
            phone,
            password
          })
        }
      );
      if (!response.ok) {
        const errorData = responseData;
        console.error("Icona API signup error:", errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message,
          // Use the actual API message
          error: errorData.message || "Account creation failed. Please try again.",
          // Fallback for compatibility
          details: errorData
        });
      }
      const parseResult = iconaAuthResponseSchema.safeParse(responseData);
      if (!parseResult.success) {
        console.error("Invalid signup response structure:", parseResult.error);
        return res.status(500).json({
          success: false,
          error: "Invalid response from authentication service"
        });
      }
      const data = parseResult.data;
      console.log("Signup successful");
      req.session.user = data.data;
      req.session.accessToken = data.accessToken;
      res.json({
        success: true,
        data: data.data,
        accessToken: data.accessToken,
        // Return token for localStorage storage
        message: data.message
      });
    } catch (error) {
      console.error("Signup proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process signup request",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Proxying login request to Icona API");
      console.log("Login payload received:", {
        ...req.body,
        password: "[REDACTED]"
      });
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const { email, password } = validationResult.data;
      const { response, data: responseData } = await resilientFetch(
        `${BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );
      if (!response.ok) {
        const errorData = responseData;
        console.error("Icona API login error:", errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message,
          // Use the actual API message
          error: errorData.message || "Login failed. Please try again.",
          // Fallback for compatibility
          details: errorData
        });
      }
      const parseResult = iconaAuthResponseSchema.safeParse(responseData);
      if (!parseResult.success) {
        console.error("Invalid login response structure:", parseResult.error);
        return res.status(500).json({
          success: false,
          error: "Invalid response from authentication service"
        });
      }
      const data = parseResult.data;
      console.log("Login successful");
      req.session.user = data.data;
      req.session.accessToken = data.accessToken;
      res.json({
        success: true,
        data: data.data,
        accessToken: data.accessToken,
        // Return token for localStorage storage
        message: data.message
      });
    } catch (error) {
      console.error("Login proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process login request",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/auth/social", async (req, res) => {
    try {
      console.log("Processing social auth with Firebase token verification");
      console.log("Social auth payload received:", {
        ...req.body,
        idToken: "[REDACTED]"
      });
      const validationResult = socialAuthSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const socialAuthData = validationResult.data;
      console.log("Verifying Firebase ID token...");
      const decodedToken = await verifyFirebaseToken(socialAuthData.idToken);
      console.log("Firebase token verified successfully for UID:", decodedToken.uid);
      const verifiedSocialAuthData = {
        email: decodedToken.email || socialAuthData.email,
        firstName: socialAuthData.firstName,
        lastName: socialAuthData.lastName,
        userName: socialAuthData.userName,
        type: socialAuthData.type,
        profilePhoto: decodedToken.picture || socialAuthData.profilePhoto,
        country: socialAuthData.country,
        phone: socialAuthData.phone,
        gender: socialAuthData.gender
      };
      const { response, data: responseData } = await resilientFetch(
        `${BASE_URL}/auth/social`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(verifiedSocialAuthData)
        }
      );
      if (!response.ok) {
        const errorData = responseData;
        console.error("Icona API social auth error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Social authentication failed",
          details: errorData
        });
      }
      const parseResult = iconaAuthResponseSchema.safeParse(responseData);
      if (!parseResult.success) {
        console.error("Invalid social auth response structure:", parseResult.error);
        return res.status(500).json({
          success: false,
          error: "Invalid response from authentication service"
        });
      }
      const data = parseResult.data;
      console.log("Social auth successful");
      req.session.user = data.data;
      req.session.accessToken = data.accessToken;
      res.json({
        success: true,
        data: data.data,
        accessToken: data.accessToken,
        // Return token for localStorage storage
        message: data.message,
        newuser: data.newuser || false
      });
    } catch (error) {
      console.error("Social auth proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process social auth request",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/auth/social/complete", async (req, res) => {
    try {
      console.log("Proxying social auth completion request to Icona API");
      console.log("Social auth completion payload received:", req.body);
      const validationResult = socialAuthCompleteSchema.safeParse({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        country: req.body.country,
        phone: req.body.phone,
        gender: req.body.gender
      });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const socialAuthData = {
        ...validationResult.data,
        email: req.body.email,
        type: req.body.type,
        profilePhoto: req.body.profilePhoto
      };
      const apiEndpoint = `${BASE_URL}/auth`;
      const { response, data: responseData } = await resilientFetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: socialAuthData.email,
          firstName: socialAuthData.firstName,
          lastName: socialAuthData.lastName,
          userName: socialAuthData.userName,
          country: socialAuthData.country,
          phone: socialAuthData.phone,
          gender: socialAuthData.gender,
          type: socialAuthData.type,
          profilePhoto: socialAuthData.profilePhoto
        })
      });
      if (!response.ok) {
        const errorData = responseData;
        console.error("Icona API social auth completion error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Social authentication completion failed",
          details: errorData
        });
      }
      const parseResult = iconaAuthResponseSchema.safeParse(responseData);
      if (!parseResult.success) {
        console.error("Invalid social auth completion response structure:", parseResult.error);
        return res.status(500).json({
          success: false,
          error: "Invalid response from authentication service"
        });
      }
      const data = parseResult.data;
      console.log("Social auth completion successful");
      req.session.user = data.data;
      req.session.accessToken = data.accessToken;
      res.json({
        success: true,
        data: data.data,
        accessToken: data.accessToken,
        // Return token for localStorage storage
        message: data.message || "Profile completed successfully"
      });
    } catch (error) {
      console.error("Social auth completion proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process social auth completion request",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/users/profile", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const userId = req.session.user._id || req.session.user.id;
      const url = `${BASE_URL}/users/${userId}`;
      console.log(`Updating user profile at: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Profile update error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to update profile",
          details: errorData
        });
      }
      console.log(`Fetching fresh user data from: ${url}`);
      const getUserResponse = await fetch6(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!getUserResponse.ok) {
        const errorData = await getUserResponse.json().catch(() => ({}));
        console.error("Failed to fetch fresh user data:", errorData);
        const updateData = await response.json();
        req.session.user = {
          ...req.session.user,
          ...updateData.data
        };
        return res.json({
          success: true,
          data: updateData.data,
          message: "Profile updated successfully"
        });
      }
      const freshUserData = await getUserResponse.json();
      req.session.user = {
        ...req.session.user,
        ...freshUserData.data
      };
      res.json({
        success: true,
        data: freshUserData.data,
        message: "Profile updated successfully"
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/notifications", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const { title, ids, message, screen, id, sender, senderName, senderphoto } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No recipient IDs provided"
        });
      }
      console.log(`Sending mention notifications to ${ids.length} users`);
      const url = `${BASE_URL}/notifications`;
      console.log(`Notification API URL: ${url}`);
      const response = await fetch6(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          ids,
          message,
          screen,
          id,
          sender,
          senderName,
          senderphoto
        })
      });
      console.log(`Notification API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Notification error response:", errorText);
        return res.status(response.status).json({
          success: false,
          error: "Failed to send notifications"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data,
        message: "Notifications sent successfully"
      });
    } catch (error) {
      console.error("Notification endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send notifications"
      });
    }
  });
  app2.get("/users", async (req, res) => {
    try {
      const title = req.query.title;
      const page = req.query.page || "1";
      const limit = req.query.limit || "10";
      const accessToken = req.session?.accessToken;
      const currentUserId = req.session?.user?._id || req.session?.user?.id;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      if (!title || title.trim().length < 1) {
        return res.json({
          success: true,
          data: [],
          message: "Query too short"
        });
      }
      console.log(`Searching users with title: ${title}`);
      const params = new URLSearchParams({
        page,
        limit,
        title,
        currentUserId
      });
      const url = `${BASE_URL}/users?${params.toString()}`;
      console.log(`User search API URL: ${url}`);
      const response = await fetch6(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`User search API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("User search error response:", errorText);
        return res.json({
          success: true,
          data: [],
          message: "No users found"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.users || data.data || [],
        message: "Users retrieved successfully"
      });
    } catch (error) {
      console.error("User search endpoint error:", error);
      res.json({
        success: true,
        data: [],
        message: "Search failed"
      });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      let requestedUserId = req.params.id;
      if (!req.session.user || !req.session.accessToken) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (requestedUserId === "me") {
        requestedUserId = sessionUserId;
      }
      if (requestedUserId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot access other user's data"
        });
      }
      res.json({
        success: true,
        data: req.session.user,
        message: "User data retrieved successfully"
      });
    } catch (error) {
      console.error("User data retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve user data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/users/paymentmethod/default/:id", async (req, res) => {
    try {
      const requestedUserId = req.params.id;
      if (!req.session.user || !req.session.accessToken) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      const accessToken = req.session.accessToken;
      if (requestedUserId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot access other user's payment data"
        });
      }
      console.log(`Fetching default payment method for user: ${requestedUserId}`);
      try {
        const { response, data: responseData } = await resilientFetch(
          `${BASE_URL}/stripe/default/paymentmethod/default/${requestedUserId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (response.ok) {
          console.log("Default payment method fetched from API:", responseData ? "EXISTS" : "NULL");
          return res.json(responseData);
        }
        console.warn(`API returned status ${response.status}, will return null`);
      } catch (apiError) {
        console.warn(
          "API call failed:",
          apiError instanceof Error ? apiError.message : String(apiError)
        );
      }
      console.log("No default payment method found");
      res.json(null);
    } catch (error) {
      console.error("Default payment method retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve default payment method",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/users/paymentmethod/:id", async (req, res) => {
    try {
      const requestedUserId = req.params.id;
      if (!req.session.user || !req.session.accessToken) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      const accessToken = req.session.accessToken;
      if (requestedUserId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot access other user's payment data"
        });
      }
      console.log(`Fetching all payment methods for user: ${requestedUserId}`);
      const { response, data: responseData } = await resilientFetch(
        `${BASE_URL}/users/paymentmethod/${requestedUserId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        console.error(`Icona API error fetching payment methods ${requestedUserId}:`, responseData);
        return res.status(response.status).json({
          success: false,
          error: responseData?.message || "Failed to fetch payment methods"
        });
      }
      const paymentMethods = Array.isArray(responseData) ? responseData : [];
      console.log("Payment methods fetched:", paymentMethods.length, "methods");
      res.json(paymentMethods);
    } catch (error) {
      console.error("Payment method retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve payment methods",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/follow/:myId/:tofollowId", async (req, res) => {
    try {
      const { myId, tofollowId } = req.params;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (myId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot follow on behalf of another user"
        });
      }
      console.log(`Following user: ${myId} -> ${tofollowId}`);
      const url = `${BASE_URL}/users/follow/${myId}/${tofollowId}`;
      console.log(`Follow API URL: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Follow API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Follow error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to follow user (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully followed user"
      });
    } catch (error) {
      console.error("Follow endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to follow user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/unfollow/:myId/:tofollowId", async (req, res) => {
    try {
      const { myId, tofollowId } = req.params;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (myId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot unfollow on behalf of another user"
        });
      }
      console.log(`Unfollowing user: ${myId} -> ${tofollowId}`);
      const url = `${BASE_URL}/users/unfollow/${myId}/${tofollowId}`;
      console.log(`Unfollow API URL: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Unfollow API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Unfollow error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to unfollow user (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully unfollowed user"
      });
    } catch (error) {
      console.error("Unfollow endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to unfollow user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/block/:myId/:toBlock", async (req, res) => {
    try {
      const { myId, toBlock } = req.params;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (myId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot block on behalf of another user"
        });
      }
      console.log(`Blocking user: ${myId} -> ${toBlock}`);
      const url = `${BASE_URL}/users/block/${myId}/${toBlock}`;
      console.log(`Block API URL: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Block API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Block error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to block user (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully blocked user"
      });
    } catch (error) {
      console.error("Block endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to block user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/unblock/:myId/:toBlock", async (req, res) => {
    try {
      const { myId, toBlock } = req.params;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (myId !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot unblock on behalf of another user"
        });
      }
      console.log(`Unblocking user: ${myId} -> ${toBlock}`);
      const url = `${BASE_URL}/users/unblock/${myId}/${toBlock}`;
      console.log(`Unblock API URL: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Unblock API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Unblock error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to unblock user (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully unblocked user"
      });
    } catch (error) {
      console.error("Unblock endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to unblock user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/report", async (req, res) => {
    try {
      const { reason, reported_by, reported } = req.body;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (reported_by !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot report on behalf of another user"
        });
      }
      if (!reason || !reported) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: reason and reported user ID"
        });
      }
      console.log(`Reporting user: ${reported_by} reporting ${reported} for: ${reason}`);
      const url = `${BASE_URL}/users/report`;
      console.log(`Report API URL: ${url}`);
      const response = await fetch6(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason,
          reported_by,
          reported
        })
      });
      console.log(`Report API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Report error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to report user (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully reported user"
      });
    } catch (error) {
      console.error("Report endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to report user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/category/follow/:id", async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { userid } = req.body;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (userid !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot follow category on behalf of another user"
        });
      }
      if (!categoryId || !userid) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: category ID and user ID"
        });
      }
      console.log(`Following category: User ${userid} following category ${categoryId}`);
      const url = `${BASE_URL}/category/follow/${categoryId}`;
      console.log(`Category follow API URL: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userid
        })
      });
      console.log(`Category follow API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Category follow error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to follow category (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully followed category"
      });
    } catch (error) {
      console.error("Category follow endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to follow category",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/category/unfollow/:id", async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { userid } = req.body;
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No active session found"
        });
      }
      const sessionUserId = req.session.user._id || req.session.user.id;
      if (userid !== sessionUserId) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Cannot unfollow category on behalf of another user"
        });
      }
      if (!categoryId || !userid) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: category ID and user ID"
        });
      }
      console.log(`Unfollowing category: User ${userid} unfollowing category ${categoryId}`);
      const url = `${BASE_URL}/category/unfollow/${categoryId}`;
      console.log(`Category unfollow API URL: ${url}`);
      const response = await fetch6(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userid
        })
      });
      console.log(`Category unfollow API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Category unfollow error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to unfollow category (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data,
        message: data.message || "Successfully unfollowed category"
      });
    } catch (error) {
      console.error("Category unfollow endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to unfollow category",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/users/review/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required"
        });
      }
      console.log(`Fetching reviews for user: ${userId}`);
      const url = `${BASE_URL}/users/review/${userId}`;
      console.log(`Reviews API URL: ${url}`);
      const response = await fetch6(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log(`Reviews API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Reviews fetch error response:", errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to fetch reviews (API returned ${response.status})`,
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        reviews: data.data || []
      });
    } catch (error) {
      console.error("Reviews endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch reviews",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({
            success: false,
            error: "Failed to logout"
          });
        }
        res.clearCookie("sessionId");
        res.json({
          success: true,
          message: "Logged out successfully"
        });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to logout"
      });
    }
  });
  app2.get("/api/users/userexists/email", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== "string") {
        return res.status(400).json({
          success: false,
          error: "Email parameter is required"
        });
      }
      console.log("Checking if user exists with email:", email);
      const checkPayload = {
        email,
        password: "dummy-password-for-existence-check-12345"
      };
      const { response, data } = await resilientFetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkPayload)
      });
      console.log("User existence check response status:", response.status);
      console.log("User existence check response data:", data);
      if (response.ok) {
        res.json({
          success: true,
          exists: true,
          message: "User exists"
        });
      } else if (response.status === 400 || response.status === 401 || response.status === 422) {
        const errorMessage = data?.message || data?.error || "";
        console.log("User existence check error message:", errorMessage);
        if (errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("user does not exist") || errorMessage.toLowerCase().includes("no user found")) {
          res.json({
            success: true,
            exists: false,
            message: "User does not exist"
          });
        } else {
          res.json({
            success: true,
            exists: true,
            message: "User exists"
          });
        }
      } else if (response.status === 500) {
        const errorMessage = data?.message || data?.error || "";
        console.log("500 error message:", errorMessage);
        if (errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("user does not exist")) {
          res.json({
            success: true,
            exists: false,
            message: "User does not exist"
          });
        } else {
          res.json({
            success: true,
            exists: true,
            message: "User exists (unable to verify)"
          });
        }
      } else {
        res.json({
          success: true,
          exists: true,
          message: "User exists (unable to verify)"
        });
      }
    } catch (error) {
      console.error("User existence check error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check user existence",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/admin/auth/login", async (req, res) => {
    try {
      console.log("Proxying admin login request to Icona API");
      console.log("Admin login payload received:", {
        ...req.body,
        password: "[REDACTED]"
      });
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }
      const { email, password } = validationResult.data;
      const { response, data: responseData } = await resilientFetch(
        `${BASE_URL}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );
      if (!response.ok) {
        const errorData = responseData;
        console.error("Icona API admin login error:", errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message,
          error: errorData.message || "Admin login failed. Please try again.",
          details: errorData
        });
      }
      console.log("Admin login raw response:", JSON.stringify(responseData).substring(0, 500));
      const adminResponse = responseData;
      const normalizedResponse = {
        success: adminResponse.success,
        data: adminResponse.user || adminResponse.data,
        accessToken: adminResponse.accesstoken || adminResponse.accessToken,
        message: adminResponse.message || "Admin login successful"
      };
      const parseResult = iconaAuthResponseSchema.safeParse(normalizedResponse);
      if (!parseResult.success) {
        console.error("Invalid admin login response structure:", parseResult.error);
        console.error("Raw response data:", JSON.stringify(responseData).substring(0, 500));
        return res.status(500).json({
          success: false,
          error: "Invalid response from authentication service"
        });
      }
      const data = parseResult.data;
      console.log("Admin login successful, user data:", data.data ? "present" : "missing");
      req.session.user = {
        ...data.data,
        admin: true,
        // Explicitly set admin flag for admin login
        role: data.data?.role || "admin"
        // Preserve role from API or default to 'admin'
      };
      req.session.accessToken = data.accessToken;
      console.log("Session user set with admin flag:", req.session.user?.admin);
      console.log("Session user role:", req.session.user?.role);
      res.json({
        success: true,
        data: {
          ...data.data,
          admin: true,
          role: data.data?.role || "admin"
        },
        accessToken: data.accessToken,
        // Return token to frontend for storage
        message: data.message
      });
    } catch (error) {
      console.error("Admin login proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process admin login request",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/user/transactions", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      if (!accessToken || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const userId = req.session.user._id || req.session.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }
      const queryParams = new URLSearchParams();
      queryParams.append("userId", userId);
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.status) queryParams.append("status", req.query.status);
      const url = `${BASE_URL}/transactions?${queryParams.toString()}`;
      console.log(`Fetching user transactions from: ${url}`);
      const response = await fetch6(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`User transactions API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from transactions API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Transactions API returned non-JSON response",
          details: `Status: ${response.status}`
        });
      }
      const data = await response.json();
      if (!response.ok) {
        console.error(`User transactions API error:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch transactions",
          details: data
        });
      }
      console.log("External API response keys:", Object.keys(data));
      console.log("Has pages:", "pages" in data);
      console.log("Has total:", "total" in data);
      console.log("Pages value:", data.pages);
      console.log("Total value:", data.total);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch transactions",
        details: error.message
      });
    }
  });
  app2.get("/api/public/settings", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }
      const url = `${BASE_URL}/admin/app/settings`;
      console.log(`Fetching public settings from: ${url}`);
      const response = await fetch6(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.error(`Public settings API error: ${response.status}`);
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch settings"
        });
      }
      const data = await response.json();
      const settings = Array.isArray(data) ? data[0] : data;
      res.json({
        success: true,
        data: {
          stripe_fee: settings?.stripe_fee || "0",
          extra_charges: settings?.extra_charges || "0",
          support_email: settings?.support_email || "support@icona.com"
        }
      });
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch settings",
        details: error.message
      });
    }
  });
  app2.get("/api/auth/session", (req, res) => {
    const tokenFromHeader = req.headers["x-admin-token"];
    if (req.session?.user) {
      return res.json({
        success: true,
        data: req.session.user
      });
    }
    if (tokenFromHeader && req.headers["x-admin-user"]) {
      try {
        const userDataHeader = req.headers["x-admin-user"];
        const decoded = Buffer.from(userDataHeader, "base64").toString("utf8");
        const userData = JSON.parse(decoded);
        req.session.user = userData;
        req.session.accessToken = tokenFromHeader;
        return res.json({
          success: true,
          data: userData
        });
      } catch (error) {
        console.error("Failed to parse user data from header:", error);
      }
    }
    return res.status(401).json({
      success: false,
      error: "No active session"
    });
  });
}

// ../shared-backend/server/routes/products.ts
import fetch7 from "node-fetch";
import { z as z3 } from "zod";
var createProductSchema = z3.object({
  name: z3.string().min(1, "Product name is required").optional(),
  description: z3.string().optional(),
  price: z3.coerce.number({ invalid_type_error: "Price must be a number" }).positive("Price must be a positive number").optional(),
  quantity: z3.coerce.number({ invalid_type_error: "Quantity must be a number" }).int().min(0, "Quantity must be a non-negative integer").optional(),
  category: z3.string().optional(),
  status: z3.string().optional(),
  listingType: z3.enum(["auction", "buy_now", "giveaway"]).optional(),
  weight: z3.string().optional(),
  height: z3.string().optional(),
  width: z3.string().optional(),
  length: z3.string().optional(),
  scale: z3.string().optional(),
  shippingProfile: z3.string().optional(),
  images: z3.array(z3.string()).optional(),
  discountedPrice: z3.coerce.number().optional(),
  startingPrice: z3.coerce.number().optional(),
  duration: z3.coerce.number().optional(),
  sudden: z3.boolean().optional(),
  colors: z3.array(z3.string()).optional(),
  sizes: z3.array(z3.string()).optional(),
  reserved: z3.boolean().optional(),
  tokshow: z3.union([z3.boolean(), z3.string(), z3.null()]).optional(),
  featured: z3.boolean().optional().default(false),
  userId: z3.string().optional()
});
function registerProductRoutes(app2) {
  app2.get("/api/products/search", async (req, res) => {
    try {
      const { q } = req.query;
      console.log("Proxying product search request to Icona API with query:", q);
      if (!q || typeof q !== "string") {
        return res.json({ products: [] });
      }
      const url = `${BASE_URL}/products/search?q=${encodeURIComponent(q)}`;
      console.log("Final search API URL being called:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch7(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(
          `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data?.results?.users && data.results.users.length > 0) {
        console.log("Sample user from search results:", JSON.stringify(data.results.users[0], null, 2));
      }
      res.json(data);
    } catch (error) {
      console.error("Product search proxy error:", error);
      res.status(500).json({ error: "Failed to search products from Icona API", products: [] });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(
        "Proxying individual product request to Icona API for product:",
        id
      );
      const url = `${BASE_URL}/products/products/${id}`;
      console.log("Final API URL being called:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch7(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(
          `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Individual product proxy error:", error);
      res.status(500).json({ error: "Failed to fetch product from Icona API" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      console.log("Proxying products request to Icona API");
      console.log("Query params received:", req.query);
      const queryParams = new URLSearchParams();
      if (req.query.userId || req.query.userid) {
        queryParams.set("userid", req.query.userId || req.query.userid);
      }
      if (req.query.roomId) {
        console.log("Adding roomId to query:", req.query.roomId);
        queryParams.set("roomid", req.query.roomId);
      } else {
        console.log("No roomId in query");
      }
      if (req.query.saletype) {
        console.log("Adding saletype to query:", req.query.saletype);
        queryParams.set("saletype", req.query.saletype);
      } else {
        console.log("No saletype in query");
      }
      if (req.query.status && req.query.status !== "all") {
        queryParams.set("status", req.query.status);
      }
      if (req.query.type) {
        queryParams.set("type", req.query.type);
      }
      if (req.query.page) {
        queryParams.set("page", req.query.page);
      }
      if (req.query.limit) {
        queryParams.set("limit", req.query.limit);
      }
      if (req.query.categoryId) {
        queryParams.set("category", req.query.categoryId);
      }
      if (req.query.featured !== void 0) {
        queryParams.set("featured", req.query.featured);
      }
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/products${queryString ? "?" + queryString : ""}`;
      console.log("Final API URL being called:", url);
      const response = await fetch7(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(
          `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      if (req.query.saletype === "auction" && req.query.featured === void 0) {
        const products = data.products || data.data || [];
        console.log(`\u{1F50D} Total auctions before filtering: ${products.length}`);
        console.log(`\u{1F50D} Featured auctions:`, products.filter((p) => p.featured === true).map((p) => ({ id: p._id, name: p.name, featured: p.featured })));
        const nonFeaturedProducts = products.filter((product) => product.featured !== true);
        console.log(`\u{1F50D} Non-featured auctions after filtering: ${nonFeaturedProducts.length}`);
        if (data.products) {
          data.products = nonFeaturedProducts;
        } else if (data.data) {
          data.data = nonFeaturedProducts;
        }
      }
      res.json(data);
    } catch (error) {
      console.error("Products proxy error:", error);
      res.status(500).json({ error: "Failed to fetch products from Icona API" });
    }
  });
  app2.post("/api/products/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Creating product via Icona API for user:", userId);
      console.log("Product data received:", req.body);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const validationResult = createProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation failed:", JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({
          error: "Invalid product data",
          details: validationResult.error.errors
        });
      }
      const productData = validationResult.data;
      const iconaProductData = {
        name: productData.name,
        ...productData.price && { price: productData.price },
        quantity: productData.quantity,
        userId,
        description: productData.description,
        category: productData.category,
        listing_type: productData.listingType,
        status: productData.status || "draft",
        featured: productData.featured || false,
        // Only include optional fields if they have values (filter out empty strings)
        ...req.body.images && { images: req.body.images },
        ...req.body.discountedPrice && {
          discountedPrice: req.body.discountedPrice
        },
        ...req.body.startingPrice && {
          startingPrice: req.body.startingPrice
        },
        ...req.body.duration && { duration: req.body.duration },
        ...req.body.sudden !== void 0 && { sudden: req.body.sudden },
        ...req.body.colors && { colors: req.body.colors },
        ...req.body.sizes && { sizes: req.body.sizes },
        ...req.body.reserved !== void 0 && { reserved: req.body.reserved },
        ...req.body.tokshow !== void 0 && { tokshow: req.body.tokshow },
        ...req.body.shippingProfile && req.body.shippingProfile.trim() && {
          shipping_profile: req.body.shippingProfile
        },
        ...req.body.weight && req.body.weight.trim() && { weight: req.body.weight },
        ...req.body.height && req.body.height.trim() && { height: req.body.height },
        ...req.body.width && req.body.width.trim() && { width: req.body.width },
        ...req.body.length && req.body.length.trim() && { length: req.body.length },
        ...req.body.scale && req.body.scale.trim() && { scale: req.body.scale }
      };
      const headers = {
        "Content-Type": "application/json"
      };
      console.log("Session data:", {
        hasSession: !!req.session,
        hasAccessToken: !!req.session?.accessToken,
        tokenPreview: req.session?.accessToken ? req.session.accessToken.substring(0, 20) + "..." : "NO TOKEN"
      });
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
        console.log("Authorization header added");
      } else {
        console.log("WARNING: No access token found in session");
      }
      console.log(
        "Sending to Icona API:",
        JSON.stringify(iconaProductData, null, 2)
      );
      const response = await fetch7(`${BASE_URL}/products/${userId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(iconaProductData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      console.log("Product created successfully:", data);
      res.json(data);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({
        error: "Failed to create product",
        message: error.message || "Unknown error occurred"
      });
    }
  });
  app2.post("/api/products/bulkadd/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Bulk adding products via Icona API for user:", userId);
      console.log(
        "Number of products received:",
        req.body.products?.length || 0
      );
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      if (!req.body.products || !Array.isArray(req.body.products)) {
        return res.status(400).json({ error: "Products array is required" });
      }
      const validationErrors = [];
      const validatedProducts = [];
      for (let i = 0; i < req.body.products.length; i++) {
        const product = req.body.products[i];
        const validationResult = createProductSchema.safeParse(product);
        if (!validationResult.success) {
          validationErrors.push({
            index: i,
            product,
            errors: validationResult.error.errors
          });
        } else {
          validatedProducts.push(validationResult.data);
        }
      }
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid product data",
          validationErrors
        });
      }
      const iconaProducts = validatedProducts.map((productData) => ({
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        ownerId: userId,
        description: productData.description,
        category: productData.category,
        listing_type: productData.listingType || "buy_now",
        status: productData.status || "active",
        featured: productData.featured || false,
        weight: productData.weight || ""
      }));
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
        console.log("Authorization header added for bulk upload");
      } else {
        console.log(
          "WARNING: No access token found in session for bulk upload"
        );
      }
      console.log("Sending bulk products to Icona API:", {
        endpoint: `${BASE_URL}/products/products/bulkadd`,
        productCount: iconaProducts.length
      });
      console.log("Actual payload being sent:", JSON.stringify({ products: iconaProducts }, null, 2));
      const response = await fetch7(
        `${BASE_URL}/products/products/bulkadd`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ products: iconaProducts })
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      console.log("Bulk products created successfully:", {
        successful: data.successful || 0,
        failed: data.failed || 0
      });
      res.json(data);
    } catch (error) {
      console.error("Bulk product creation error:", error);
      res.status(500).json({
        error: "Failed to bulk create products",
        message: error.message || "Unknown error occurred"
      });
    }
  });
  app2.post("/api/products/images/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      console.log("Updating product images via Icona API:", productId);
      const { images } = req.body;
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ error: "Images array is required" });
      }
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch7(
        `${BASE_URL}/products/images/${productId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ images })
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      console.log("Product images updated successfully:", data);
      res.json(data);
    } catch (error) {
      console.error("Product images update error:", error);
      res.status(500).json({
        error: "Failed to update product images",
        message: error.message || "Unknown error occurred"
      });
    }
  });
  app2.patch("/api/products/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      console.log("Updating product via Icona API:", productId);
      console.log("Raw request body featured field:", req.body.featured);
      const validationResult = createProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation failed:", JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({
          error: "Invalid product data",
          details: validationResult.error.errors
        });
      }
      const productData = validationResult.data;
      console.log("Validated featured field:", productData.featured);
      const iconaUpdateData = {
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        images: productData.images,
        userId: productData.userId,
        description: productData.description,
        category: productData.category,
        discountedPrice: productData.discountedPrice,
        startingPrice: productData.startingPrice,
        duration: productData.duration,
        sudden: productData.sudden,
        colors: productData.colors,
        sizes: productData.sizes,
        reserved: productData.reserved,
        listing_type: productData.listingType,
        tokshow: productData.tokshow,
        featured: productData.featured || false,
        shipping_profile: productData.shippingProfile?.trim() ? productData.shippingProfile : null
      };
      console.log(
        "Sending to external API - featured field:",
        iconaUpdateData.featured
      );
      console.log("Sending to external API - sudden:", iconaUpdateData.sudden);
      console.log("Sending to external API - duration:", iconaUpdateData.duration);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch7(
        `${BASE_URL}/products/products/${productId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(iconaUpdateData)
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Product update error:", error);
      res.status(500).json({
        error: "Failed to update product",
        message: error.message || "Unknown error occurred"
      });
    }
  });
  app2.put("/api/products/:productId/delete", async (req, res) => {
    try {
      const { productId } = req.params;
      console.log("Soft deleting product via Icona API:", productId);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch7(
        `${BASE_URL}/products/products/${productId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ deleted: true })
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({
        error: "Failed to delete product",
        message: error.message || "Unknown error occurred"
      });
    }
  });
  app2.put("/api/products/bulkedit", async (req, res) => {
    try {
      const { productIds, updates } = req.body;
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds array is required" });
      }
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "updates object is required" });
      }
      console.log(`Bulk editing ${productIds.length} products:`, { productIds, updates });
      const iconaUpdates = {
        ...updates,
        // Map shippingProfile to shipping_profile if present
        ...updates.shippingProfile && {
          shipping_profile: updates.shippingProfile,
          shippingProfile: void 0
        }
      };
      Object.keys(iconaUpdates).forEach((key) => {
        if (iconaUpdates[key] === void 0) {
          delete iconaUpdates[key];
        }
      });
      const payload = {
        productIds,
        updates: iconaUpdates
      };
      console.log("Sending to Icona API:", JSON.stringify(payload, null, 2));
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
        console.log("Authorization header added for bulk edit");
      } else {
        console.log("WARNING: No access token found in session for bulk edit");
      }
      const response = await fetch7(`${BASE_URL}/products/products/bulkedit/all`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });
      console.log(`Icona API response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Icona API error:", errorData);
        throw new Error(
          errorData.message || `Icona API returned ${response.status}: ${response.statusText}`
        );
      }
      const data = await response.json();
      console.log("Bulk edit successful:", data);
      res.json(data);
    } catch (error) {
      console.error("Bulk edit error:", error);
      res.status(500).json({
        error: "Failed to bulk edit products",
        message: error.message || "Unknown error occurred"
      });
    }
  });
}

// ../shared-backend/server/routes/categories.ts
import fetch8 from "node-fetch";
function registerCategoryRoutes(app2) {
  app2.get("/api/categories", async (req, res) => {
    try {
      console.log("Proxying categories request to Icona API");
      console.log("Query params received:", req.query);
      const queryParams = new URLSearchParams();
      if (req.query.userId) {
        queryParams.set("userid", req.query.userId);
      }
      if (req.query.status && req.query.status !== "all") {
        queryParams.set("status", req.query.status);
      }
      if (req.query.page) {
        queryParams.set("page", req.query.page);
      }
      if (req.query.limit) {
        queryParams.set("limit", req.query.limit);
      }
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/category${queryString ? "?" + queryString : ""}`;
      console.log("Final API URL being called:", url);
      const response = await fetch8(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Categories proxy error:", error);
      res.status(500).json({ error: "Failed to fetch categories from Icona API" });
    }
  });
}

// ../shared-backend/server/routes/addresses.ts
import fetch9 from "node-fetch";
function registerAddressRoutes(app2) {
  app2.get("/api/address/all/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Fetching addresses for user:", userId);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch9(`${BASE_URL}/address/all/${userId}`, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Address API response (first address):", JSON.stringify(data[0], null, 2));
      const transformedData = data.map((address) => ({
        ...address,
        zipcode: address.zip || address.zipcode || ""
        // Map zip to zipcode for frontend
      }));
      res.json(transformedData);
    } catch (error) {
      console.error("Get addresses error:", error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });
  app2.get("/api/address/default/address/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Fetching default address for user:", userId);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch9(`${BASE_URL}/address/all/${userId}`, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const addresses = await response.json();
      console.log(`Fetched ${addresses?.length || 0} addresses for user ${userId}`);
      const defaultAddress = addresses?.find((addr) => addr.primary === true);
      console.log("Default address found:", defaultAddress ? "YES" : "NO");
      if (!defaultAddress) {
        return res.json({ address: null });
      }
      const transformedData = {
        address: {
          ...defaultAddress,
          zipcode: defaultAddress.zip || defaultAddress.zipcode || ""
          // Map zip to zipcode for frontend
        }
      };
      res.json(transformedData);
    } catch (error) {
      console.error("Get default address error:", error);
      res.status(500).json({ error: "Failed to fetch default address" });
    }
  });
  app2.post("/api/address", async (req, res) => {
    try {
      const validationResult = createAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.issues
        });
      }
      const validatedData = validationResult.data;
      console.log("Creating address via Icona API for user:", validatedData.userId);
      const transformedBody = {
        userId: validatedData.userId,
        name: validatedData.name,
        addrress1: validatedData.addrress1,
        addrress2: validatedData.addrress2,
        city: validatedData.city,
        state: validatedData.state,
        stateCode: validatedData.stateCode || "",
        // Add state code
        cityCode: validatedData.cityCode || "",
        // Add city code
        zip: validatedData.zipcode,
        // ICONA stores in 'zip' field
        zipcode: validatedData.zipcode,
        // Also send zipcode for compatibility
        country: validatedData.country || validatedData.countryCode,
        // Use country name if available, fallback to code
        countryCode: validatedData.countryCode,
        street1: validatedData.addrress1,
        phone: validatedData.phone,
        email: validatedData.email,
        validate: true
      };
      console.log("Sending to Icona API:", JSON.stringify(transformedBody, null, 2));
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch9(`${BASE_URL}/address`, {
        method: "POST",
        headers,
        body: JSON.stringify(transformedBody)
      });
      const responseText = await response.text();
      console.log("Icona API response status:", response.status);
      console.log("Icona API response body:", responseText);
      let isActualError = !response.ok;
      try {
        const jsonCheck = JSON.parse(responseText);
        if (jsonCheck.success === true) {
          isActualError = false;
        }
      } catch (e) {
      }
      if (isActualError) {
        console.error(`Icona API error ${response.status}:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          console.log("Parsed API error message:", apiMessage);
          return res.status(response.status).json({
            error: apiMessage,
            // Return the actual API validation message
            details: errorJson,
            sentData: transformedBody
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Address validation failed",
            details: responseText,
            sentData: transformedBody
          });
        }
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Create address error:", error);
      res.status(500).json({
        error: "Failed to create address",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.put("/api/address/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      const validationResult = updateAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.issues
        });
      }
      const validatedData = validationResult.data;
      console.log("Updating address via Icona API:", addressId);
      const transformedBody = {
        userId: validatedData.userId,
        name: validatedData.name,
        addrress1: validatedData.addrress1,
        addrress2: validatedData.addrress2,
        city: validatedData.city,
        state: validatedData.state,
        stateCode: validatedData.stateCode || "",
        // Add state code
        cityCode: validatedData.cityCode || "",
        // Add city code
        zip: validatedData.zipcode,
        // ICONA stores in 'zip' field
        zipcode: validatedData.zipcode,
        // Also send zipcode for compatibility
        country: validatedData.country || validatedData.countryCode,
        // Use country name if available, fallback to code
        countryCode: validatedData.countryCode,
        street1: validatedData.addrress1,
        phone: validatedData.phone,
        email: validatedData.email,
        validate: true
      };
      console.log("Sending to Icona API:", JSON.stringify(transformedBody, null, 2));
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch9(`${BASE_URL}/address/${addressId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(transformedBody)
      });
      const responseText = await response.text();
      console.log("Icona API response status:", response.status);
      console.log("Icona API response body:", responseText);
      let isActualError = !response.ok;
      try {
        const jsonCheck = JSON.parse(responseText);
        if (jsonCheck.success === true) {
          isActualError = false;
        }
      } catch (e) {
      }
      if (isActualError) {
        console.error(`Icona API error ${response.status}:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          console.log("Parsed API error message:", apiMessage);
          return res.status(response.status).json({
            error: apiMessage,
            // Return the actual API validation message
            details: errorJson,
            sentData: transformedBody
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Address validation failed",
            details: responseText,
            sentData: transformedBody
          });
        }
      }
      const data = JSON.parse(responseText);
      if (data.data) {
        const responseData = data.data;
        if (transformedBody.zip && !responseData.zipcode) {
          responseData.zipcode = transformedBody.zip;
        }
        res.json(responseData);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error("Update address error:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });
  app2.patch("/api/address/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      const validationResult = makePrimaryAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.issues
        });
      }
      const validatedData = validationResult.data;
      console.log("Setting address as primary via Icona API:", addressId);
      const requestBody = { primary: validatedData.primary, userId: validatedData.userId };
      console.log("Sending to Icona API:", JSON.stringify(requestBody, null, 2));
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch9(`${BASE_URL}/address/${addressId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(requestBody)
      });
      const responseText = await response.text();
      console.log("Icona API response status:", response.status);
      console.log("Icona API response body:", responseText);
      if (!response.ok) {
        console.error(`Icona API error ${response.status}:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          console.log("Parsed API error message:", apiMessage);
          return res.status(response.status).json({
            error: apiMessage,
            // Return the actual API validation message
            details: errorJson,
            sentData: requestBody
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Address validation failed",
            details: responseText,
            sentData: requestBody
          });
        }
      }
      const data = JSON.parse(responseText);
      if (data.data) {
        res.json(data.data);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error("Update address primary status error:", error);
      res.status(500).json({ error: "Failed to update address primary status" });
    }
  });
  app2.delete("/api/address/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      console.log("Deleting address via Icona API:", addressId);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch9(`${BASE_URL}/address/${addressId}`, {
        method: "DELETE",
        headers
      });
      if (!response.ok) {
        throw new Error(`Icona API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delete address error:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });
}

// ../shared-backend/server/routes/payment-methods.ts
import fetch10 from "node-fetch";
function registerPaymentMethodRoutes(app2) {
  app2.get("/users/paymentmethod/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID is required"
        });
      }
      console.log("Fetching payment methods for user:", userId);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch10(`${BASE_URL}/users/paymentmethod/${userId}`, {
        method: "GET",
        headers
      });
      const responseText = await response.text();
      console.log("Get payment methods response status:", response.status);
      if (!response.ok) {
        console.error(`Icona API get payment methods error ${response.status}`);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          return res.status(response.status).json({
            error: apiMessage,
            details: errorJson
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Failed to get payment methods",
            details: responseText
          });
        }
      }
      const data = responseText ? JSON.parse(responseText) : [];
      res.json(data);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({
        error: "Failed to get payment methods",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.delete("/stripe/remove", async (req, res) => {
    try {
      const { paymentMethodId, userid } = req.body;
      if (!paymentMethodId || !userid) {
        return res.status(400).json({
          error: "Payment method ID and user ID are required"
        });
      }
      console.log("Deleting payment method:", { paymentMethodId, userid });
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch10(`${BASE_URL}/stripe/remove`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ paymentMethodId, userid })
      });
      const responseText = await response.text();
      console.log("Delete payment method response status:", response.status);
      if (!response.ok) {
        console.error(`Icona API delete error ${response.status}`);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          return res.status(response.status).json({
            error: apiMessage,
            details: errorJson
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Failed to delete payment method",
            details: responseText
          });
        }
      }
      const data = responseText ? JSON.parse(responseText) : {};
      res.json(data);
    } catch (error) {
      console.error("Delete payment method error:", error);
      res.status(500).json({
        error: "Failed to delete payment method",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.put("/stripe/default", async (req, res) => {
    try {
      const { userid, paymentMethodId } = req.body;
      if (!paymentMethodId || !userid) {
        return res.status(400).json({
          error: "User ID and payment method ID are required"
        });
      }
      console.log("Setting default payment method:", { userid, paymentMethodId });
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch10(`${BASE_URL}/stripe/default`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ userid, paymentMethodId })
      });
      const responseText = await response.text();
      console.log("Set default payment method response status:", response.status);
      if (!response.ok) {
        console.error(`Icona API set default error ${response.status}`);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          return res.status(response.status).json({
            error: apiMessage,
            details: errorJson
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Failed to set default payment method",
            details: responseText
          });
        }
      }
      const data = responseText ? JSON.parse(responseText) : {};
      res.json(data);
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({
        error: "Failed to set default payment method",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/payment-methods", async (req, res) => {
    try {
      const { paymentMethodId, userId } = req.body;
      if (!paymentMethodId || !userId) {
        return res.status(400).json({
          error: "Payment method ID and user ID are required"
        });
      }
      console.log("Adding payment method via Icona API:", { paymentMethodId, userId });
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch10(`${BASE_URL}/users/paymentmethod`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          paymentMethodId,
          userId
        })
      });
      const responseText = await response.text();
      console.log("Icona API response status:", response.status);
      console.log("Icona API response body:", responseText);
      if (!response.ok) {
        console.error(`Icona API error ${response.status}:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          return res.status(response.status).json({
            error: apiMessage,
            details: errorJson
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Failed to add payment method",
            details: responseText
          });
        }
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Add payment method error:", error);
      res.status(500).json({
        error: "Failed to add payment method",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/stripe/setupitent", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          error: "Email is required"
        });
      }
      console.log("Creating Stripe setup intent for email:", email);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const response = await fetch10(`${BASE_URL}/stripe/setupitent`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: email.trim() })
      });
      const responseText = await response.text();
      console.log("Stripe setup intent response status:", response.status);
      if (!response.ok) {
        console.error(`Stripe setup intent API error ${response.status}`);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          return res.status(response.status).json({
            error: apiMessage,
            details: errorJson
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Failed to create setup intent",
            details: responseText
          });
        }
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Stripe setup intent error:", error);
      res.status(500).json({
        error: "Failed to create setup intent",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/stripe/savepaymentmethod", async (req, res) => {
    try {
      const { customer_id, methodid, userid } = req.body;
      const trimmedCustomerId = typeof customer_id === "string" ? customer_id.trim() : "";
      const trimmedUserId = typeof userid === "string" ? userid.trim() : "";
      const trimmedMethodId = methodid && typeof methodid === "string" ? methodid.trim() : void 0;
      if (!trimmedUserId || !trimmedCustomerId) {
        return res.status(400).json({
          error: "Customer ID and user ID are required and must be non-empty"
        });
      }
      console.log("Saving Stripe payment method:", {
        customer_id: trimmedCustomerId,
        methodid: trimmedMethodId || "none (adding new)",
        userid: trimmedUserId
      });
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const payload = {
        customer_id: trimmedCustomerId,
        userid: trimmedUserId
      };
      if (trimmedMethodId) {
        payload.methodid = trimmedMethodId;
      }
      const response = await fetch10(`${BASE_URL}/stripe/savepaymentmethod`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      console.log("Stripe save payment method response status:", response.status);
      if (!response.ok) {
        console.error(`Stripe API error ${response.status}`);
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          return res.status(response.status).json({
            error: apiMessage,
            details: errorJson
          });
        } catch (e) {
          return res.status(response.status).json({
            error: responseText || "Failed to save payment method",
            details: responseText
          });
        }
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Save Stripe payment method error:", error);
      res.status(500).json({
        error: "Failed to save payment method",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

// ../shared-backend/server/routes/admin.ts
import multer from "multer";
import FormData from "form-data";
import axios from "axios";

// ../shared-backend/server/utils/email.ts
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
async function sendEmail(settings, emailData) {
  const provider = settings.email_service_provider?.toLowerCase();
  console.log(`[Email] Attempting to send email using provider: ${provider}`);
  console.log(`[Email] From: ${settings.email_from_address}, To: ${emailData.to}`);
  if (!settings.email_from_address) {
    throw new Error("From email address not configured");
  }
  const fromEmail = settings.email_from_name ? `${settings.email_from_name} <${settings.email_from_address}>` : settings.email_from_address;
  switch (provider) {
    case "sendgrid":
      return sendWithSendGrid(settings, emailData, fromEmail);
    case "mailgun":
      return sendWithMailgun(settings, emailData, fromEmail);
    case "resend":
      return sendWithResend(settings, emailData, fromEmail);
    case "smtp":
      return sendWithSMTP(settings, emailData, fromEmail);
    default:
      throw new Error(`Unsupported email provider: ${provider || "not configured"}`);
  }
}
async function sendWithSendGrid(settings, emailData, fromEmail) {
  if (!settings.email_api_key) {
    throw new Error("SendGrid API key not configured");
  }
  sgMail.setApiKey(settings.email_api_key);
  const msg = {
    to: emailData.to,
    from: fromEmail,
    subject: emailData.subject,
    text: emailData.text || emailData.html.replace(/<[^>]*>/g, ""),
    html: emailData.html
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    if (error.response?.body?.errors?.[0]?.message) {
      throw new Error(`SendGrid: ${error.response.body.errors[0].message}`);
    }
    throw error;
  }
}
async function sendWithMailgun(settings, emailData, fromEmail) {
  if (!settings.email_api_key) {
    throw new Error("Mailgun API key not configured");
  }
  if (!settings.email_mailgun_domain) {
    throw new Error("Mailgun domain not configured");
  }
  const domain = settings.email_mailgun_domain;
  const apiKey = settings.email_api_key;
  console.log(`[Mailgun] Sending email via domain: ${domain}`);
  console.log(`[Mailgun] API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);
  const formData = new URLSearchParams();
  formData.append("from", fromEmail);
  formData.append("to", emailData.to);
  formData.append("subject", emailData.subject);
  formData.append("html", emailData.html);
  if (emailData.text) {
    formData.append("text", emailData.text);
  }
  if (settings.email_reply_to) {
    formData.append("h:Reply-To", settings.email_reply_to);
  }
  const url = `https://api.mailgun.net/v3/${domain}/messages`;
  console.log(`[Mailgun] Endpoint: ${url}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });
  console.log(`[Mailgun] Response status: ${response.status} ${response.statusText}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Mailgun] Error response:`, errorText);
    if (response.status === 401) {
      throw new Error(`Mailgun Authentication Failed: Invalid API key. Please check your Mailgun API key in settings.`);
    }
    if (response.status === 403) {
      throw new Error(`Mailgun Forbidden: The API key doesn't have permission for domain "${domain}". Make sure the API key and domain are from the same Mailgun account.`);
    }
    if (response.status === 404) {
      throw new Error(`Mailgun Domain Not Found: Domain "${domain}" not found. Please verify the domain name in settings.`);
    }
    throw new Error(`Mailgun error (${response.status}): ${errorText}`);
  }
  console.log(`[Mailgun] Email sent successfully!`);
}
async function sendWithResend(settings, emailData, fromEmail) {
  if (!settings.email_api_key) {
    throw new Error("Resend API key not configured");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.email_api_key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`Resend error: ${error.message || response.statusText}`);
  }
}
async function sendWithSMTP(settings, emailData, fromEmail) {
  if (!settings.email_smtp_host || !settings.email_smtp_port || !settings.email_smtp_user || !settings.email_smtp_pass) {
    throw new Error("SMTP configuration incomplete. Please configure host, port, user, and password");
  }
  const host = settings.email_smtp_host;
  const port = settings.email_smtp_port;
  const user = settings.email_smtp_user;
  const pass = settings.email_smtp_pass;
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465,
    auth: {
      user,
      pass
    }
  });
  try {
    console.log(`[SMTP] Connecting to ${host}:${port} as ${user}`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ""),
      html: emailData.html
    });
    console.log(`[SMTP] Email sent successfully! Message ID: ${info.messageId}`);
    console.log(`[SMTP] Response:`, info.response);
  } catch (error) {
    const errorMessage = error.message || String(error);
    if (errorMessage.includes("Username and Password not accepted") || errorMessage.includes("BadCredentials")) {
      throw new Error(
        "SMTP Authentication Failed: Invalid username or password. If using Gmail, you must use an App Password instead of your regular password. Visit https://myaccount.google.com/apppasswords to generate one."
      );
    }
    if (errorMessage.includes("ECONNREFUSED")) {
      throw new Error(`SMTP Connection Failed: Unable to connect to ${host}:${port}. Please check your host and port settings.`);
    }
    if (errorMessage.includes("ETIMEDOUT")) {
      throw new Error(`SMTP Timeout: Connection to ${host}:${port} timed out. Please check your network and firewall settings.`);
    }
    if (errorMessage.includes("421") || errorMessage.includes("Temporary System Problem")) {
      throw new Error(
        "SMTP Temporary Error: The email server is temporarily unavailable or rate limiting. This is usually due to sending too many emails in a short time. Please try again in a few minutes."
      );
    }
    if (errorMessage.includes("450") || errorMessage.includes("451") || errorMessage.includes("452")) {
      throw new Error(
        "SMTP Temporary Error: The email server rejected the request temporarily. Please wait a few minutes and try again."
      );
    }
    throw new Error(`SMTP Error: ${errorMessage}`);
  }
}

// ../shared-backend/server/routes/admin.ts
var upload = multer({ storage: multer.memoryStorage() });
function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please log in again."
    });
  }
  if (!req.session.user.admin) {
    return res.status(403).json({
      success: false,
      error: "Admin access required"
    });
  }
  next();
}
async function checkDemoMode(req, res, next) {
  try {
    const accessToken = req.session.accessToken;
    if (!accessToken) {
      return next();
    }
    const url = `${BASE_URL}/admin/app/settings`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      return next();
    }
    const data = await response.json();
    const settings = Array.isArray(data) ? data[0] : data;
    if (settings?.demoMode === true) {
      return res.status(403).json({
        success: false,
        error: "This operation is disabled in demo mode",
        demoMode: true
      });
    }
    next();
  } catch (error) {
    console.error("Error checking demo mode:", error);
    next();
  }
}
function registerAdminRoutes(app2) {
  app2.get("/api/admin/exists", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const url = `${BASE_URL}/admin/exists`;
      console.log(`Checking if admin exists at external API: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.log(`External API returned status ${response.status}`);
        return res.json({
          success: true,
          exists: false
        });
      }
      const data = await response.json();
      const adminExists = data.exists === true;
      console.log(`\u2705 External API response: ${JSON.stringify(data)}, adminExists: ${adminExists}`);
      return res.json({
        success: true,
        exists: adminExists
      });
    } catch (error) {
      console.error("Error checking if admin exists:", error);
      return res.json({
        success: true,
        exists: false
      });
    }
  });
  app2.get("/api/admin/check-setup", async (req, res) => {
    try {
      const url = `${BASE_URL}/admin`;
      console.log(`Checking if admins exist: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        const admins = Array.isArray(data) ? data : data.data || [];
        res.json({
          success: true,
          setupNeeded: admins.length === 0,
          adminCount: admins.length
        });
      } else {
        res.json({
          success: true,
          setupNeeded: false,
          adminCount: -1
        });
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      res.json({
        success: true,
        setupNeeded: false,
        adminCount: -1
      });
    }
  });
  app2.post("/api/admin/setup", async (req, res) => {
    try {
      const { email, password, username, full_name, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required"
        });
      }
      const possibleEndpoints = [
        `${BASE_URL}/admin/register`,
        `${BASE_URL}/admin/signup`,
        `${BASE_URL}/admin`
      ];
      let response;
      let lastError = null;
      for (const url of possibleEndpoints) {
        console.log(`Attempting to create admin at: ${url}`);
        try {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email,
              password,
              username: username || "admin",
              full_name: full_name || "Admin",
              firstName: full_name?.split(" ")[0] || "Admin",
              lastName: full_name?.split(" ")[1] || "",
              role: role || "admin"
            })
          });
          if (response.ok) {
            console.log(`\u2705 Successfully created admin using endpoint: ${url}`);
            break;
          } else {
            const errorText = await response.text();
            console.log(`\u274C Endpoint ${url} failed with status ${response.status}: ${errorText.substring(0, 200)}`);
            lastError = { status: response.status, message: errorText };
          }
        } catch (err) {
          console.log(`\u274C Endpoint ${url} threw error: ${err.message}`);
          lastError = { status: 500, message: err.message };
        }
      }
      if (!response || !response.ok) {
        console.error("All admin creation endpoints failed. Last error:", lastError);
        return res.status(lastError?.status || 500).json({
          success: false,
          error: "Failed to create admin account. The API endpoint may not be available.",
          details: lastError?.message
        });
      }
      const data = await response.json();
      if (data.accesstoken) {
        req.session.accessToken = data.accesstoken;
        req.session.user = {
          ...data.user,
          admin: true
        };
      }
      res.json({
        success: true,
        user: data.user,
        message: "Admin account created successfully"
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create admin",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.title) queryParams.append("title", req.query.title);
      const url = `${BASE_URL}/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching users from: ${url}`);
      console.log(`Using accessToken (first 50 chars): ${accessToken ? accessToken.substring(0, 50) : "NO TOKEN"}...`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Users API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      console.log(`Users API content-type: ${contentType}`);
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from users API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Users API returned non-JSON response",
          details: `Status: ${response.status}, Content-Type: ${contentType}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      console.log(`Users API data structure:`, Object.keys(data));
      console.log(`Pagination values - totalDoc: ${data.totalDoc}, limits: ${data.limits}, pages (current): ${data.pages}, users count: ${data.users?.length}`);
      if (!response.ok) {
        console.error(`Users API error response:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch users",
          details: data
        });
      }
      const totalPages = Math.ceil(data.totalDoc / data.limits);
      console.log(`Calculated total pages: ${totalPages}, current page: ${data.pages}`);
      res.json({
        success: true,
        data: {
          users: data.users,
          totalDoc: data.totalDoc,
          limits: data.limits,
          currentPage: data.pages,
          pages: totalPages
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users/:userId/addresses", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const response = await fetch(
        `${BASE_URL}/admin/users/${userId}/addresses`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch user addresses",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user addresses",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users/:userId/shipping-profiles", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const response = await fetch(
        `${BASE_URL}/admin/users/${userId}/shipping-profiles`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch user shipping profiles",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error fetching user shipping profiles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user shipping profiles",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/products/:productId", requireAdmin, async (req, res) => {
    try {
      const { productId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/products/?_id=${productId}&populate=shipping`;
      console.log(`Fetching product details from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Product details API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from product details API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Product details API returned non-JSON response",
          details: `Status: ${response.status}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      if (!response.ok) {
        console.error(`Product details API error:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch product details",
          details: data
        });
      }
      const product = data.products?.[0] || data.data?.products?.[0];
      if (product) {
        console.log(`Product detail fields:`, Object.keys(product));
        console.log(`Product detail quantity/stock values:`, {
          quantity: product.quantity,
          stock: product.stock
        });
      }
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Product not found"
        });
      }
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error("Error fetching product details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch product details",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.category) queryParams.append("category", req.query.category);
      if (req.query.title) queryParams.append("title", req.query.title);
      if (req.query.price) queryParams.append("price", req.query.price);
      if (req.query.userid) queryParams.append("userid", req.query.userid);
      const url = `${BASE_URL}/products/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching products from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Products API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      console.log(`Products API content-type: ${contentType}`);
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from products API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Products API returned non-JSON response",
          details: `Status: ${response.status}, Content-Type: ${contentType}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      console.log(`Products API data structure:`, Object.keys(data));
      if (data.products && data.products.length > 0) {
        console.log(`Sample product fields:`, Object.keys(data.products[0]));
        console.log(`Product quantity/stock values:`, {
          quantity: data.products[0].quantity,
          stock: data.products[0].stock
        });
      }
      if (!response.ok) {
        console.error(`Products API error response:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch products",
          details: data
        });
      }
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch products",
        details: error.message
      });
    }
  });
  app2.patch("/api/admin/products/:productId", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const { productId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      console.log(`Admin updating product: ${productId}`);
      console.log(`Update payload:`, req.body);
      const url = `${BASE_URL}/products/products/${productId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      console.log(`Admin product update API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from product update API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Product update API returned non-JSON response",
          details: `Status: ${response.status}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      if (!response.ok) {
        console.error(`Product update API error:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to update product",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update product",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users/:userId/inventory", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const response = await fetch(
        `${BASE_URL}/admin/users/${userId}/inventory`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch user inventory",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error fetching user inventory:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user inventory",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users/:userId/orders", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const response = await fetch(
        `${BASE_URL}/admin/users/${userId}/orders`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch user orders",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user orders",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/users/${userId}`;
      console.log(`Fetching user details from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`User details API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      console.log(`User details API content-type: ${contentType}`);
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from user details API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "User details API returned non-JSON response",
          details: `Status: ${response.status}, URL: ${url}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch user details",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user details",
        details: error.message
      });
    }
  });
  app2.patch("/api/admin/users/:userId/approve-seller", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const { userId } = req.params;
      const { email } = req.body;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/users/approveseller/${userId}`;
      console.log(`Approving seller at: ${url}`);
      console.log(`Seller approval payload:`, { email });
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      console.log(`Seller approval API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from seller approval API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Seller approval API returned non-JSON response",
          details: `Status: ${response.status}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      if (!response.ok) {
        console.error(`Seller approval API error:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to approve seller",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error approving seller:", error);
      res.status(500).json({
        success: false,
        error: "Failed to approve seller",
        details: error.message
      });
    }
  });
  app2.patch("/api/admin/users/:userId", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/users/${userId}`;
      console.log(`Updating user at: ${url}`);
      console.log(`Update payload:`, req.body);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      console.log(`User update API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from user update API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "User update API returned non-JSON response",
          details: `Status: ${response.status}`,
          response: textResponse.substring(0, 200)
        });
      }
      const data = await response.json();
      if (!response.ok) {
        console.error(`User update API error:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to update user",
          details: data
        });
      }
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.userId) queryParams.append("userId", req.query.userId);
      const url = `${BASE_URL}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching transactions from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Transactions API response status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`Non-JSON response from transactions API: ${textResponse.substring(0, 500)}`);
        return res.status(500).json({
          success: false,
          error: "Transactions API returned non-JSON response",
          details: `Status: ${response.status}`
        });
      }
      const data = await response.json();
      if (!response.ok) {
        console.error(`Transactions API error:`, data);
        return res.status(response.status).json({
          success: false,
          error: data.message || "Failed to fetch transactions",
          details: data
        });
      }
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch transactions",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/shows", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.title) queryParams.append("title", req.query.title);
      if (req.query.type) queryParams.append("type", req.query.type);
      queryParams.append("sort", "-1");
      const url = `${BASE_URL}/rooms${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching shows from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch shows"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data.rooms || [],
        pages: data.pages || 1,
        totalDoc: data.totalDoc || 0
      });
    } catch (error) {
      console.error("Error fetching shows:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch shows",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/shows/:showId", requireAdmin, async (req, res) => {
    try {
      const { showId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/rooms/${showId}`;
      console.log(`Fetching show details from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch show details"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data
      });
    } catch (error) {
      console.error("Error fetching show details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch show details",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/shows/:showId/auctions", requireAdmin, async (req, res) => {
    try {
      const { showId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      queryParams.append("roomid", showId);
      queryParams.append("saletype", "auction");
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      const url = `${BASE_URL}/products/?${queryParams.toString()}`;
      console.log(`Fetching show auctions from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch show auctions"
        });
      }
      const data = await response.json();
      const allAuctions = data.data || data.products || [];
      const nonFeaturedAuctions = allAuctions.filter((auction) => auction.featured !== true);
      res.json({
        success: true,
        data: nonFeaturedAuctions,
        pages: data.pages || 1,
        totalDoc: nonFeaturedAuctions.length
      });
    } catch (error) {
      console.error("Error fetching show auctions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch show auctions",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/shows/:showId/giveaways", requireAdmin, async (req, res) => {
    try {
      const { showId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      queryParams.append("room", showId);
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      const url = `${BASE_URL}/giveaways/?${queryParams.toString()}`;
      console.log(`Fetching show giveaways from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch show giveaways"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data.giveaways || [],
        pages: data.pages || 1,
        totalDoc: data.totalDoc || 0
      });
    } catch (error) {
      console.error("Error fetching show giveaways:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch show giveaways",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/shows/:showId/buy-now", requireAdmin, async (req, res) => {
    try {
      const { showId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      queryParams.append("roomid", showId);
      queryParams.append("saletype", "buy_now");
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      queryParams.append("featured", "false");
      const url = `${BASE_URL}/products/?${queryParams.toString()}`;
      console.log(`Fetching show buy now items from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch show buy now items"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data.products || [],
        pages: data.pages || 1,
        totalDoc: data.totalDoc || 0
      });
    } catch (error) {
      console.error("Error fetching show buy now items:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch show buy now items",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/shows/:showId/sold", requireAdmin, async (req, res) => {
    try {
      const { showId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      queryParams.append("tokshow", showId);
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      const url = `${BASE_URL}/orders?${queryParams.toString()}`;
      console.log(`Fetching show sold orders from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch show sold orders"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: data.data || data.orders || [],
        pages: data.pages || 1,
        total: data.total || 0
      });
    } catch (error) {
      console.error("Error fetching show sold orders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch show sold orders",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/demo-mode", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/admin/app/settings`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const data = await response.json();
      const settings = Array.isArray(data) ? data[0] : data;
      res.json({
        success: true,
        demoMode: settings?.demoMode || false
      });
    } catch (error) {
      console.error("Error fetching demo mode status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch demo mode status",
        demoMode: false
        // Default to false on error
      });
    }
  });
  app2.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/admin/app/settings`;
      console.log(`Fetching app settings from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch app settings"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: Array.isArray(data) ? data[0] : data
      });
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch app settings",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/settings", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/admin/app/settings`;
      console.log(`Updating app settings at: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Settings update error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to update app settings",
          details: errorData
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error updating app settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update app settings",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/upload-logo", requireAdmin, checkDemoMode, upload.single("logo"), async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No logo file uploaded"
        });
      }
      const formData = new FormData();
      formData.append("logo", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      const url = `${BASE_URL}/settings/upload-logo`;
      console.log(`Uploading logo to: ${url}`);
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${accessToken}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      res.json({
        success: true,
        data: response.data,
        message: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload logo",
        details: error.response?.data || error.message
      });
    }
  });
  app2.get("/api/admin/profile/:userId", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { userId } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/admin/profile/${userId}`;
      console.log(`Fetching admin profile from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch admin profile"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch admin profile",
        details: error.message
      });
    }
  });
  app2.patch("/api/admin/profile", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const userId = req.session.user.id || req.session.user._id;
      const url = `${BASE_URL}/admin/${userId}`;
      console.log(`Updating admin profile at: ${url}`);
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Profile update error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to update profile",
          details: errorData
        });
      }
      const data = await response.json();
      if (data) {
        req.session.user = { ...req.session.user, ...data };
      }
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/application-fees", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.starting_after) queryParams.append("starting_after", req.query.starting_after);
      if (req.query.ending_before) queryParams.append("ending_before", req.query.ending_before);
      if (req.query.from) queryParams.append("from", req.query.from);
      if (req.query.to) queryParams.append("to", req.query.to);
      if (req.query.charge) queryParams.append("charge", req.query.charge);
      if (req.query.account) queryParams.append("account", req.query.account);
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/stripe/application/fees${queryString ? `?${queryString}` : ""}`;
      console.log(`Fetching application fees from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch application fees"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data: Array.isArray(data) ? data : data.data || [],
        has_more: data.has_more || false
      });
    } catch (error) {
      console.error("Error fetching application fees:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch application fees",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/stripe-payouts", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { status, from, to, destination, limit, starting_after, ending_before } = req.query;
      const queryParams = new URLSearchParams();
      if (status) queryParams.append("status", status);
      if (from) queryParams.append("from", from);
      if (to) queryParams.append("to", to);
      if (destination) queryParams.append("destination", destination);
      if (limit) queryParams.append("limit", limit);
      if (starting_after) queryParams.append("starting_after", starting_after);
      if (ending_before) queryParams.append("ending_before", ending_before);
      const stripeUrl = `${BASE_URL}/stripe/transactions/all/payouts${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      console.log(`Fetching all Stripe payouts from: ${stripeUrl}`);
      const stripeResponse = await fetch(stripeUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!stripeResponse.ok) {
        console.log(`Stripe API returned ${stripeResponse.status}, returning empty data`);
        return res.json({
          success: true,
          data: [],
          message: "No Stripe data available"
        });
      }
      const stripeData = await stripeResponse.json();
      res.json({
        success: true,
        data: stripeData.payouts || stripeData.data || [],
        has_more: stripeData.has_more || false
      });
    } catch (error) {
      console.error("Error fetching Stripe payouts:", error);
      res.json({
        success: true,
        data: [],
        message: "Unable to fetch Stripe payouts"
      });
    }
  });
  app2.get("/api/admin/categories/:categoryId", requireAdmin, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/category/${categoryId}`;
      console.log(`Fetching category from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch category"
        });
      }
      const data = await response.json();
      console.log("Single category API response structure:", Object.keys(data));
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch category",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.title) queryParams.append("title", req.query.title);
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/category${queryString ? `?${queryString}` : ""}`;
      console.log(`Fetching categories from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch categories"
        });
      }
      const data = await response.json();
      console.log("Categories API response structure:", Object.keys(data));
      console.log("Categories API response data type:", Array.isArray(data) ? "Array" : typeof data);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch categories",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/categories", requireAdmin, checkDemoMode, upload.array("images", 5), async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { name } = req.body;
      const files = req.files;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Category name is required"
        });
      }
      const formData = new FormData();
      formData.append("name", name);
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("images", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: file.size
          });
        });
      }
      const url = `${BASE_URL}/category`;
      console.log(`Adding category to: ${url}`);
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = response.data;
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add category",
        details: error.message
      });
    }
  });
  app2.put("/api/admin/categories/:id", requireAdmin, checkDemoMode, upload.array("images", 5), async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { id } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { name } = req.body;
      const files = req.files;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Category name is required"
        });
      }
      const formData = new FormData();
      formData.append("name", name);
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("images", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: file.size
          });
        });
      }
      const url = `${BASE_URL}/category/${id}`;
      console.log(`Updating category at: ${url}`);
      const response = await axios.put(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = response.data;
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update category",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/categories/bulk", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { names } = req.body;
      if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Names array is required"
        });
      }
      const formattedNames = names.map((name) => ({ name }));
      const url = `${BASE_URL}/category/bulk/add`;
      console.log(`Bulk importing categories to: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formattedNames)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to bulk import categories"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error bulk importing categories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to bulk import categories",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/subcategories", requireAdmin, checkDemoMode, upload.array("images", 5), async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { name, category } = req.body;
      const files = req.files;
      console.log("Add subcategory - Request body:", req.body);
      console.log("Add subcategory - Files:", files?.length || 0);
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Subcategory name is required"
        });
      }
      if (!category) {
        console.error("Category field missing! Body keys:", Object.keys(req.body));
        return res.status(400).json({
          success: false,
          error: "Category ID is required"
        });
      }
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("type", "child");
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("images", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: file.size
          });
        });
      }
      const url = `${BASE_URL}/category`;
      console.log(`Adding subcategory to: ${url}`);
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = response.data;
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error adding subcategory:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add subcategory",
        details: error.message
      });
    }
  });
  app2.put("/api/admin/subcategories/:id", requireAdmin, checkDemoMode, upload.array("images", 5), async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { id } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { name, category } = req.body;
      const files = req.files;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Subcategory name is required"
        });
      }
      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", "child");
      if (category) {
        formData.append("category", category);
      }
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("images", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: file.size
          });
        });
      }
      const url = `${BASE_URL}/category/${id}`;
      console.log(`Updating subcategory at: ${url}`);
      const response = await axios.put(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = response.data;
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update subcategory",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/categories/:categoryId/subcategories/bulk", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { categoryId } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { names } = req.body;
      if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Names array is required"
        });
      }
      const formattedNames = names.map((name) => ({ name, type: "child" }));
      const url = `${BASE_URL}/category/subcategory/bulk/${categoryId}`;
      console.log(`Bulk importing subcategories to: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formattedNames)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to bulk import subcategories"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error bulk importing subcategories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to bulk import subcategories",
        details: error.message
      });
    }
  });
  app2.put("/api/admin/categories/:id/convert", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { id } = req.params;
      const { targetType, parentId } = req.body;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (!targetType || !["parent", "child"].includes(targetType)) {
        return res.status(400).json({
          success: false,
          error: "Valid target type (parent or child) is required"
        });
      }
      if (targetType === "child" && !parentId) {
        return res.status(400).json({
          success: false,
          error: "Parent category ID is required when converting to child"
        });
      }
      const formData = new FormData();
      const getCategoryUrl = `${BASE_URL}/category/${id}`;
      const getCategoryResponse = await fetch(getCategoryUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!getCategoryResponse.ok) {
        throw new Error("Failed to fetch category details");
      }
      const categoryData = await getCategoryResponse.json();
      const currentCategory = categoryData.data || categoryData;
      formData.append("name", currentCategory.name);
      if (targetType === "child") {
        formData.append("category", parentId);
        formData.append("type", "child");
      } else {
        formData.append("type", "parent");
      }
      const url = `${BASE_URL}/category/${id}`;
      console.log(`Converting category type at: ${url} to ${targetType}`);
      const response = await axios.put(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = response.data;
      res.json({
        success: true,
        data,
        message: `Category converted to ${targetType} successfully`
      });
    } catch (error) {
      console.error("Error converting category type:", error);
      res.status(500).json({
        success: false,
        error: "Failed to convert category type",
        details: error.message
      });
    }
  });
  app2.delete("/api/admin/subcategories/:id", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { id } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/category/${id}`;
      console.log(`Deleting subcategory from: ${url}`);
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to delete subcategory"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete subcategory",
        details: error.message
      });
    }
  });
  app2.delete("/api/admin/categories/:id", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { id } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/category/${id}`;
      console.log(`Deleting category from: ${url}`);
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to delete category"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete category",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/disputes", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.status) queryParams.append("status", req.query.status);
      const url = `${BASE_URL}/orders/all/disputes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching disputes from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to fetch disputes"
        });
      }
      const data = await response.json();
      console.log("Disputes list API response sample:", JSON.stringify(data[0], null, 2));
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch disputes",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/disputes/:disputeId", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { disputeId } = req.params;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/orders/dispute/${disputeId}`;
      console.log(`Fetching dispute from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log("Dispute detail response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Dispute detail API error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to fetch dispute"
        });
      }
      const data = await response.json();
      console.log("Dispute detail API response:", JSON.stringify(data, null, 2));
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching dispute:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dispute",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/disputes/:disputeId/resolve", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { disputeId } = req.params;
      const { favored, final_comments } = req.body;
      console.log(`[Resolve Dispute] Received request for dispute ID: ${disputeId}`);
      console.log(`[Resolve Dispute] Favored user: ${favored}, Comments: ${final_comments}`);
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (!favored) {
        return res.status(400).json({
          success: false,
          error: "Favored user ID is required"
        });
      }
      const url = `${BASE_URL}/orders/close/dispute/${disputeId}`;
      console.log(`[Resolve Dispute] Calling ICONA API: ${url}`);
      console.log(`[Resolve Dispute] Payload:`, { favored, final_comments });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          favored,
          final_comments: final_comments || ""
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to resolve dispute"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      res.status(500).json({
        success: false,
        error: "Failed to resolve dispute",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/reported-cases", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.page) queryParams.append("page", req.query.page);
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      queryParams.append("populate", "reported reported_by");
      const url = `${BASE_URL}/users/reports/cases${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching reported cases from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Reported cases API response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Reported cases API error:`, errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to fetch reported cases"
        });
      }
      const data = await response.json();
      console.log("Reported cases API response:", JSON.stringify(data, null, 2));
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching reported cases:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch reported cases",
        details: error.message
      });
    }
  });
  app2.patch("/api/admin/users/:userId/block", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { userId } = req.params;
      const { blocked } = req.body;
      console.log(`[Block User] Request to ${blocked ? "block" : "unblock"} user: ${userId}`);
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (typeof blocked !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "Blocked status is required and must be a boolean"
        });
      }
      const url = `${BASE_URL}/users/${userId}`;
      console.log(`[Block User] Calling ICONA API: ${url}`);
      console.log(`[Block User] Payload:`, { system_blocked: blocked });
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ system_blocked: blocked })
      });
      console.log(`[Block User] API response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[Block User] API error:`, errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Failed to ${blocked ? "block" : "unblock"} user`
        });
      }
      const data = await response.json();
      console.log("[Block User] Success:", data);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error(`Error blocking/unblocking user:`, error);
      res.status(500).json({
        success: false,
        error: "Failed to update user block status",
        details: error.message
      });
    }
  });
  app2.put("/api/admin/refund/:id", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { id } = req.params;
      const { type } = req.body;
      console.log(`[Refund] Request to refund ${type}: ${id}`);
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (!type || type !== "order" && type !== "transaction") {
        return res.status(400).json({
          success: false,
          error: "Type is required and must be 'order' or 'transaction'"
        });
      }
      const url = `${BASE_URL}/orders/refund/order/transaction/${id}`;
      console.log(`[Refund] Calling ICONA API: ${url} with type: ${type}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type })
      });
      console.log(`[Refund] API response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[Refund] API error:`, errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to process refund"
        });
      }
      const data = await response.json();
      console.log("[Refund] Success:", data);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error(`Error processing refund:`, error);
      res.status(500).json({
        success: false,
        error: "Failed to process refund",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/refunds", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const queryParams = new URLSearchParams();
      if (req.query.limit) queryParams.append("limit", req.query.limit);
      if (req.query.page) queryParams.append("page", req.query.page);
      const url = `${BASE_URL}/stripe/refunds/list/all${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log(`Fetching refunds from: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Refunds API error:`, errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || "Failed to fetch refunds"
        });
      }
      const data = await response.json();
      console.log("[Refunds] API Response Structure:", JSON.stringify(data, null, 2));
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching refunds:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch refunds",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/send-email", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { recipientType, recipientEmail, subject, message, isHtmlMode } = req.body;
      if (!subject || !message) {
        return res.status(400).json({
          success: false,
          error: "Subject and message are required"
        });
      }
      if (recipientType === "individual" && !recipientEmail) {
        return res.status(400).json({
          success: false,
          error: "Recipient email is required for individual emails"
        });
      }
      const settingsUrl = `${BASE_URL}/admin/app/settings`;
      const settingsResponse = await fetch(settingsUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!settingsResponse.ok) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch email settings"
        });
      }
      const settingsData = await settingsResponse.json();
      const settings = Array.isArray(settingsData) ? settingsData[0] : settingsData;
      if (!settings?.email_from_address) {
        return res.status(400).json({
          success: false,
          error: "From email address is not configured. Please configure email settings first."
        });
      }
      const provider = settings.email_service_provider?.toLowerCase();
      const validProviders = ["sendgrid", "mailgun", "resend", "smtp"];
      if (!provider || !validProviders.includes(provider)) {
        return res.status(400).json({
          success: false,
          error: `Email provider is not configured or invalid. Please select one of: ${validProviders.join(", ")}`
        });
      }
      if (provider === "mailgun") {
        if (!settings.email_api_key || settings.email_api_key.trim() === "") {
          return res.status(400).json({
            success: false,
            error: "Mailgun API key is not configured"
          });
        }
        if (!settings.email_mailgun_domain || settings.email_mailgun_domain.trim() === "") {
          return res.status(400).json({
            success: false,
            error: "Mailgun domain is not configured"
          });
        }
      } else if (provider === "smtp") {
        const missingFields = [];
        if (!settings.email_smtp_host || settings.email_smtp_host.trim() === "") missingFields.push("host");
        if (!settings.email_smtp_port || settings.email_smtp_port.trim() === "") missingFields.push("port");
        if (!settings.email_smtp_user || settings.email_smtp_user.trim() === "") missingFields.push("username");
        if (!settings.email_smtp_pass || settings.email_smtp_pass.trim() === "") missingFields.push("password");
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            error: `SMTP configuration is incomplete. Missing or empty: ${missingFields.join(", ")}`
          });
        }
      } else if (provider === "sendgrid" || provider === "resend") {
        if (!settings.email_api_key || settings.email_api_key.trim() === "") {
          return res.status(400).json({
            success: false,
            error: `${provider === "sendgrid" ? "SendGrid" : "Resend"} API key is not configured`
          });
        }
      }
      let recipients = [];
      if (recipientType === "all") {
        const usersUrl = `${BASE_URL}/users?limit=10000`;
        const usersResponse = await fetch(usersUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        if (!usersResponse.ok) {
          return res.status(500).json({
            success: false,
            error: "Failed to fetch users"
          });
        }
        const usersData = await usersResponse.json();
        recipients = usersData.users || [];
      } else {
        const usersUrl = `${BASE_URL}/users?limit=10000`;
        const usersResponse = await fetch(usersUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const allUsers = usersData.users || [];
          const targetUser = allUsers.find((u) => u.email === recipientEmail);
          recipients = targetUser ? [targetUser] : [{ email: recipientEmail }];
        } else {
          recipients = [{ email: recipientEmail }];
        }
      }
      const emailPromises = recipients.map(async (user) => {
        console.log("User object for name replacement:", JSON.stringify(user, null, 2));
        let userName = "there";
        if (user.firstName && user.lastName) {
          userName = `${user.firstName} ${user.lastName}`;
        } else if (user.first_name && user.last_name) {
          userName = `${user.first_name} ${user.last_name}`;
        } else if (user.firstName) {
          userName = user.firstName;
        } else if (user.first_name) {
          userName = user.first_name;
        } else if (user.name) {
          userName = user.name;
        } else if (user.fullName) {
          userName = user.fullName;
        } else if (user.username) {
          userName = user.username;
        }
        console.log("Resolved user name:", userName);
        const personalizedMessage = message.replace(/{name}/g, userName);
        let htmlMessage;
        if (isHtmlMode) {
          htmlMessage = personalizedMessage;
        } else {
          htmlMessage = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .message { white-space: pre-wrap; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="message">${personalizedMessage}</div>
                </div>
              </body>
            </html>
          `;
        }
        try {
          await sendEmail(settings, {
            to: user.email,
            subject,
            html: htmlMessage,
            text: personalizedMessage
          });
          return { success: true, email: user.email };
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error.message);
          return { success: false, email: user.email, error: error.message };
        }
      });
      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;
      res.json({
        success: true,
        message: `Email sent successfully to ${successCount} recipient(s)${failureCount > 0 ? `. ${failureCount} failed.` : ""}`,
        details: {
          total: recipients.length,
          successful: successCount,
          failed: failureCount,
          failures: results.filter((r) => !r.success)
        }
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send email",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/send-update-notification", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { androidLink, iosLink, androidVersion, iosVersion, recipientType, recipientEmail } = req.body;
      if (recipientType === "individual" && !recipientEmail) {
        return res.status(400).json({
          success: false,
          error: "Recipient email is required for individual notifications"
        });
      }
      const settingsUrl = `${BASE_URL}/admin/app/settings`;
      const settingsResponse = await fetch(settingsUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!settingsResponse.ok) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch email settings"
        });
      }
      const settingsData = await settingsResponse.json();
      const settings = Array.isArray(settingsData) ? settingsData[0] : settingsData;
      if (!settings?.email_from_address) {
        return res.status(400).json({
          success: false,
          error: "From email address is not configured. Please configure email settings first."
        });
      }
      let recipients = [];
      if (recipientType === "all") {
        const usersUrl = `${BASE_URL}/users?limit=10000`;
        const usersResponse = await fetch(usersUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        if (!usersResponse.ok) {
          return res.status(500).json({
            success: false,
            error: "Failed to fetch users"
          });
        }
        const usersData = await usersResponse.json();
        recipients = usersData.users || [];
      } else {
        const usersUrl = `${BASE_URL}/users?limit=10000`;
        const usersResponse = await fetch(usersUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const allUsers = usersData.users || [];
          const targetUser = allUsers.find((u) => u.email === recipientEmail);
          recipients = targetUser ? [targetUser] : [{ email: recipientEmail }];
        } else {
          recipients = [{ email: recipientEmail }];
        }
      }
      const appName = settings.app_name || "Our App";
      const BATCH_SIZE = 10;
      const BATCH_DELAY = 4e5;
      const results = [];
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);
        console.log(`Sending email batch ${batchNumber}/${totalBatches} (${batch.length} emails)...`);
        const batchPromises = batch.map(async (user) => {
          let userName = "there";
          if (user.firstName && user.lastName) {
            userName = `${user.firstName} ${user.lastName}`;
          } else if (user.first_name && user.last_name) {
            userName = `${user.first_name} ${user.last_name}`;
          } else if (user.firstName) {
            userName = user.firstName;
          } else if (user.first_name) {
            userName = user.first_name;
          } else if (user.name) {
            userName = user.name;
          } else if (user.fullName) {
            userName = user.fullName;
          } else if (user.username) {
            userName = user.username;
          }
          const htmlMessage = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    padding: 40px 20px;
                    text-align: center;
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                  }
                  .header p {
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                  }
                  .content {
                    padding: 40px 30px;
                  }
                  .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #333;
                  }
                  .message {
                    font-size: 16px;
                    line-height: 1.8;
                    color: #555;
                    margin-bottom: 30px;
                  }
                  .version-info {
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    margin: 30px 0;
                    border-radius: 4px;
                  }
                  .version-info h3 {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 18px;
                  }
                  .version-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e9ecef;
                  }
                  .version-item:last-child {
                    border-bottom: none;
                  }
                  .version-label {
                    font-weight: 600;
                    color: #555;
                  }
                  .version-number {
                    color: #667eea;
                    font-weight: 600;
                  }
                  .buttons {
                    margin: 30px 0;
                  }
                  .button {
                    display: inline-block;
                    padding: 14px 32px;
                    margin: 8px 8px 8px 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 15px;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                    transition: transform 0.2s;
                  }
                  .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                  }
                  .whatsapp-button {
                    display: inline-block;
                    padding: 16px 40px;
                    margin: 15px 0;
                    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 17px;
                    box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
                    transition: all 0.3s;
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                  }
                  .whatsapp-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
                    background: linear-gradient(135deg, #128C7E 0%, #25D366 100%);
                  }
                  .footer {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                  }
                  .footer p {
                    margin: 5px 0;
                  }
                  .features-banner {
                    background-color: #f5f7fa;
                    border-radius: 8px;
                    padding: 30px 20px;
                    margin: 30px 0;
                  }
                  .features-banner h3 {
                    text-align: center;
                    color: #333;
                    margin: 0 0 25px 0;
                    font-size: 22px;
                  }
                  .features-grid {
                    width: 100%;
                  }
                  .feature-row {
                    width: 100%;
                    margin-bottom: 10px;
                  }
                  .feature-item {
                    display: inline-block;
                    width: 48%;
                    background: #ffffff;
                    padding: 15px 10px;
                    border-radius: 6px;
                    text-align: center;
                    border: 1px solid #e0e0e0;
                    margin: 0 1% 10px 0;
                    vertical-align: top;
                    box-sizing: border-box;
                  }
                  .feature-icon {
                    font-size: 28px;
                    display: block;
                    margin-bottom: 8px;
                  }
                  .feature-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                  }
                  @media only screen and (max-width: 600px) {
                    .container {
                      margin: 0;
                      border-radius: 0;
                    }
                    .content {
                      padding: 30px 20px;
                    }
                    .button {
                      display: block;
                      margin: 10px 0;
                    }
                    .whatsapp-button {
                      display: block;
                      margin: 15px 0;
                      padding: 14px 30px;
                      font-size: 16px;
                    }
                    .feature-item {
                      width: 100% !important;
                      display: block !important;
                      margin: 0 0 10px 0 !important;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>\u{1F389} New Update Available!</h1>
                    <p>We've made ${appName} even better</p>
                  </div>
                  
                  <div class="content">
                    <div class="greeting">
                      Hi ${userName}! \u{1F44B}
                    </div>
                    
                    <div class="message">
                      <p>We're excited to announce that a new version of <strong>${appName}</strong> is now available!</p>
                      <p>This update includes bug fixes, performance improvements, and exciting new features to enhance your experience.</p>
                    </div>

                    <div class="version-info">
                      <h3>\u{1F4F1} Latest Versions</h3>
                      ${androidVersion ? `
                      <div class="version-item">
                        <span class="version-label">Android</span>
                        <span class="version-number">v${androidVersion}</span>
                      </div>
                      ` : ""}
                      ${iosVersion ? `
                      <div class="version-item">
                        <span class="version-label">iOS</span>
                        <span class="version-number">v${iosVersion}</span>
                      </div>
                      ` : ""}
                    </div>

                    <div class="buttons">
                      ${androidVersion && androidLink ? `
                        <a href="${androidLink}" class="button">
                          \u{1F4F2} Update on Android
                        </a>
                      ` : ""}
                      ${iosVersion && iosLink ? `
                        <a href="${iosLink}" class="button">
                          \u{1F34E} Update on iOS
                        </a>
                      ` : ""}
                      <a href="https://admin.iconaapp.com/" class="button">
                        \u{1F3EA} Seller Hub Portal
                      </a>
                      <a href="https://admin.iconaapp.com/admin/login" class="button">
                        \u{1F510} Admin Portal
                      </a>
                    </div>

                    <a href="https://wa.me/254791334234" class="whatsapp-button">
                      \u{1F4AC} Contact Us on WhatsApp
                    </a>

                    <div class="features-banner">
                      <h3>\u2728 What's Inside ${appName}</h3>
                      <div class="features-grid">
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F534}</div>
                          <p class="feature-title">Live Streaming & Auctions</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F381}</div>
                          <p class="feature-title">Giveaway System</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F4AC}</div>
                          <p class="feature-title">Live Chat & Messaging</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F4B0}</div>
                          <p class="feature-title">Tipping & Commission</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F4E6}</div>
                          <p class="feature-title">USPS Shipping</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F30D}</div>
                          <p class="feature-title">Multi-Language</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u{1F3A8}</div>
                          <p class="feature-title">Dark & Light Theme</p>
                        </div>
                        <div class="feature-item">
                          <div class="feature-icon">\u26A1</div>
                          <p class="feature-title">Order Management</p>
                        </div>
                      </div>
                    </div>

                    <a href="https://wa.me/254791334234" class="whatsapp-button">
                      \u{1F4AC} Need Help? Chat with Us on WhatsApp
                    </a>

                    <div class="message">
                      <p>Update now to enjoy the latest features and improvements!</p>
                      <p style="margin-top: 20px;">Thank you for using ${appName}! \u2764\uFE0F</p>
                    </div>
                  </div>

                  <div class="footer">
                    <p><strong>${appName}</strong></p>
                    <p>This is an automated update notification</p>
                  </div>
                </div>
              </body>
            </html>
          `;
          const textMessage = `
Hi ${userName}!

A new version of ${appName} is now available!

Latest Versions:
${androidVersion ? `- Android: v${androidVersion}` : ""}
${iosVersion ? `- iOS: v${iosVersion}` : ""}

Update Links:
${androidVersion && androidLink ? `Android: ${androidLink}` : ""}
${iosVersion && iosLink ? `iOS: ${iosLink}` : ""}

Quick Access:
- Seller Hub Portal: https://admin.iconaapp.com/
- Admin Portal: https://admin.iconaapp.com/admin/login

\u{1F4AC} Contact Us on WhatsApp: https://wa.me/254791334234

\u2728 What's Inside ${appName}:
\u2022 Live Streaming & Auctions - Engage customers with live sales
\u2022 Giveaway System - Run exciting contests and promotions
\u2022 Live Chat & Messaging - Connect directly with buyers
\u2022 Tipping & Commission - Multiple revenue streams
\u2022 USPS Shipping - Integrated shipping solutions
\u2022 Multi-Language - Reach global audiences
\u2022 Dark & Light Theme - Comfortable viewing experience
\u2022 Order Management - Complete fulfillment system

\u{1F4AC} Need Help? Chat with Us on WhatsApp: https://wa.me/254791334234

Update now to enjoy the latest features and improvements!

Thank you for using ${appName}!
          `.trim();
          try {
            await sendEmail(settings, {
              to: user.email,
              subject: `\u{1F389} ${appName} Update Available - New Features & Improvements`,
              html: htmlMessage,
              text: textMessage
            });
            console.log(`\u2713 Email sent to ${user.email}`);
            return { success: true, email: user.email };
          } catch (error) {
            console.error(`\u2717 Failed to send email to ${user.email}:`, error.message);
            return { success: false, email: user.email, error: error.message };
          }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        if (i + BATCH_SIZE < recipients.length) {
          console.log(`Waiting ${BATCH_DELAY / 1e3} seconds before next batch...`);
          await delay(BATCH_DELAY);
        }
      }
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;
      console.log(`Email batch sending complete: ${successCount} successful, ${failureCount} failed`);
      res.json({
        success: true,
        message: `Update notification sent successfully to ${successCount} user(s)${failureCount > 0 ? `. ${failureCount} failed.` : ""}`,
        details: {
          total: recipients.length,
          successful: successCount,
          failed: failureCount,
          failures: results.filter((r) => !r.success)
        }
      });
    } catch (error) {
      console.error("Error sending update notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send update notification",
        details: error.message
      });
    }
  });
  app2.get("/api/theme-colors", async (req, res) => {
    try {
      const url = `${BASE_URL}/admin/app/settings`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch theme colors"
        });
      }
      const settingsData = await response.json();
      const settings = Array.isArray(settingsData) ? settingsData[0] : settingsData;
      res.json({
        success: true,
        data: {
          primary_color: settings.primary_color || "FFFACC15",
          secondary_color: settings.secondary_color || "FF0D9488",
          app_logo: settings.app_logo || ""
        }
      });
    } catch (error) {
      console.error("Error fetching theme colors:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch theme colors",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/translations", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/settings/translations`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch translations"
        });
      }
      const data = await response.json();
      console.log("[Translations GET] API response keys:", Object.keys(data));
      console.log("[Translations GET] default_language value:", data.default_language);
      console.log("[Translations GET] defaultLanguage value:", data.defaultLanguage);
      res.json({
        success: true,
        data: {
          version: data.version,
          default_language: data.default_language || data.defaultLanguage,
          translations: data.translations || {}
        }
      });
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch translations",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/translations", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const { translations, default_language } = req.body;
      if (!translations || typeof translations !== "object") {
        return res.status(400).json({
          success: false,
          error: "Translations data is required"
        });
      }
      const url = `${BASE_URL}/settings/translations`;
      const payload = { ...translations };
      if (default_language) {
        const fullPayload = {};
        if (default_language) {
          fullPayload.default_language = default_language;
        }
        Object.keys(translations).forEach((lang) => {
          fullPayload[lang] = translations[lang];
        });
        const response2 = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(fullPayload)
        });
        if (!response2.ok) {
          const errorData = await response2.json().catch(() => ({}));
          return res.status(response2.status).json({
            success: false,
            error: errorData.error || errorData.message || "Failed to save translations"
          });
        }
        const data2 = await response2.json();
        return res.json({
          success: true,
          message: "Translations updated successfully",
          data: data2.translations || {}
        });
      }
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(translations)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.error || errorData.message || "Failed to save translations"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        message: "Translations updated successfully",
        data: data.translations || {}
      });
    } catch (error) {
      console.error("Error saving translations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save translations",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/translations/download", requireAdmin, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      const url = `${BASE_URL}/settings/translations`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch translations"
        });
      }
      const data = await response.json();
      const translations = data.translations || {};
      const version = data.version;
      const defaultLanguage = data.default_language;
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += "<translations";
      if (version !== void 0) xml += ` version="${version}"`;
      if (defaultLanguage) xml += ` default_language="${defaultLanguage}"`;
      xml += ">\n";
      for (const [languageCode, strings] of Object.entries(translations)) {
        xml += `  <language code="${languageCode}">
`;
        if (typeof strings === "object" && strings !== null) {
          for (const [key, value] of Object.entries(strings)) {
            const escapedValue = String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
            xml += `    <string name="${key}">${escapedValue}</string>
`;
          }
        }
        xml += `  </language>
`;
      }
      xml += "</translations>";
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Content-Disposition", 'attachment; filename="translations.xml"');
      res.send(xml);
    } catch (error) {
      console.error("Error downloading translations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download translations",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/translations/upload", requireAdmin, checkDemoMode, upload.single("file"), async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
      }
      const xmlContent = req.file.buffer.toString("utf-8");
      const translations = {};
      const languageRegex = /<language code="([^"]+)">([\s\S]*?)<\/language>/g;
      let languageMatch;
      while ((languageMatch = languageRegex.exec(xmlContent)) !== null) {
        const languageCode = languageMatch[1];
        const languageContent = languageMatch[2];
        translations[languageCode] = {};
        const stringRegex = /<string name="([^"]+)">([^<]*)<\/string>/g;
        let stringMatch;
        while ((stringMatch = stringRegex.exec(languageContent)) !== null) {
          const key = stringMatch[1];
          const value = stringMatch[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
          translations[languageCode][key] = value;
        }
      }
      if (Object.keys(translations).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid XML format or no translations found"
        });
      }
      const url = `${BASE_URL}/settings/translations`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(translations)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.error || errorData.message || "Failed to save translations"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        message: `Translations uploaded successfully. ${Object.keys(translations).length} language(s) imported.`,
        data: data.translations || {}
      });
    } catch (error) {
      console.error("Error uploading translations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload translations",
        details: error.message
      });
    }
  });
  app2.post("/api/admin/change-password", requireAdmin, checkDemoMode, async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      const { currentPassword, newPassword } = req.body;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found"
        });
      }
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password and new password are required"
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "New password must be at least 6 characters long"
        });
      }
      const userId = req.session.user.id || req.session.user._id;
      const url = `${BASE_URL}/admin/${userId}`;
      console.log(`Changing admin password at: ${url}`);
      console.log(`Password change payload:`, { password: "[REDACTED]" });
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: newPassword
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Password change error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || errorData.error || "Failed to change password"
        });
      }
      const data = await response.json();
      res.json({
        success: true,
        message: "Password changed successfully",
        data
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({
        success: false,
        error: "Failed to change password",
        details: error.message
      });
    }
  });
}

// ../shared-backend/server/routes/settings.ts
function registerSettingsRoutes(app2) {
  app2.get("/api/settings", async (req, res) => {
    try {
      const url = `${BASE_URL}/admin/app/settings`;
      console.log(`Fetching public app settings from: ${url}`);
      const accessToken = req.session?.accessToken;
      const headers = {
        "Content-Type": "application/json"
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        console.warn(`Failed to fetch settings from API, using defaults`);
        return res.json({
          success: true,
          data: {
            app_name: "App",
            seo_title: "",
            support_email: "support@example.com",
            primary_color: "#F4D03F",
            secondary_color: "#1A1A1A",
            stripe_publishable_key: "",
            commission_rate: 0
          }
        });
      }
      const data = await response.json();
      const settings = Array.isArray(data) ? data[0] : data;
      console.log("Raw settings from external API:", JSON.stringify(settings, null, 2));
      const publicSettings = {
        app_name: settings?.app_name || "App",
        seo_title: settings?.seo_title || "",
        support_email: settings?.support_email || "support@example.com",
        primary_color: settings?.primary_color || "#F4D03F",
        secondary_color: settings?.secondary_color || "#1A1A1A",
        // API returns 'stripepublickey' not 'stripe_publishable_key'
        stripe_publishable_key: settings?.stripepublickey || settings?.stripe_publishable_key || "",
        commission_rate: parseFloat(settings?.commission || "0")
        // API returns 'commission' as string
      };
      res.json({
        success: true,
        data: publicSettings
      });
    } catch (error) {
      console.error("Error fetching public app settings:", error);
      res.json({
        success: true,
        data: {
          app_name: "App",
          seo_title: "",
          support_email: "support@example.com",
          primary_color: "#F4D03F",
          secondary_color: "#1A1A1A",
          stripe_publishable_key: "",
          commission_rate: 0
        }
      });
    }
  });
}

// ../shared-backend/server/routes/giveaways.ts
function registerGiveawayRoutes(app2) {
  app2.get("/api/giveaways", async (req, res) => {
    try {
      console.log("Fetching giveaways with params:", req.query);
      const queryParams = new URLSearchParams();
      if (req.query.name) queryParams.set("name", req.query.name);
      if (req.query.page) queryParams.set("page", req.query.page);
      if (req.query.limit) queryParams.set("limit", req.query.limit);
      if (req.query.room) queryParams.set("room", req.query.room);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const url = `${BASE_URL}/giveaways?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: "Failed to fetch giveaways" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching giveaways from Icona API:", error);
      res.status(500).json({ error: "Failed to fetch giveaways" });
    }
  });
  app2.get("/api/giveaways/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Fetching single giveaway:", id);
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.session?.accessToken) {
        headers["Authorization"] = `Bearer ${req.session.accessToken}`;
      }
      const url = `${BASE_URL}/giveaways/${id}`;
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: "Giveaway not found" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching giveaway from Icona API:", error);
      res.status(500).json({ error: "Failed to fetch giveaway" });
    }
  });
  app2.post("/api/giveaways", async (req, res) => {
    try {
      console.log("Creating giveaway with data:", req.body);
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: "Unauthorized - no access token" });
      }
      if (!req.session?.user?.id) {
        return res.status(401).json({ error: "Unauthorized - no user ID" });
      }
      const giveawayData = {
        ...req.body,
        user: req.session.user.id
      };
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.session.accessToken}`
      };
      const url = `${BASE_URL}/giveaways`;
      console.log("Posting to Icona API:", url);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(giveawayData)
      });
      const responseText = await response.text();
      console.log("Icona API response status:", response.status);
      console.log("Icona API response body:", responseText);
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || "Failed to create giveaway" };
        }
        return res.status(response.status).json(errorData);
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Error creating giveaway:", error);
      res.status(500).json({ error: "Failed to create giveaway" });
    }
  });
  app2.put("/api/giveaways/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Updating giveaway:", id, "with data:", req.body);
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: "Unauthorized - no access token" });
      }
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.session.accessToken}`
      };
      const url = `${BASE_URL}/giveaways/${id}`;
      console.log("Putting to Icona API:", url);
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(req.body)
      });
      const responseText = await response.text();
      console.log("Icona API response status:", response.status);
      console.log("Icona API response body:", responseText);
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || "Failed to update giveaway" };
        }
        return res.status(response.status).json(errorData);
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Error updating giveaway:", error);
      res.status(500).json({ error: "Failed to update giveaway" });
    }
  });
  app2.delete("/api/giveaways/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Deleting giveaway:", id);
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: "Unauthorized - no access token" });
      }
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.session.accessToken}`
      };
      const url = `${BASE_URL}/giveaways/${id}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers
      });
      if (!response.ok) {
        console.error(`Icona API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Failed to delete giveaway" };
        }
        return res.status(response.status).json(errorData);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error deleting giveaway:", error);
      res.status(500).json({ error: "Failed to delete giveaway" });
    }
  });
}

// ../shared-backend/server/routes/stripe.ts
var BASE_URL2 = "https://api.iconaapp.com";
function registerStripeRoutes(app2) {
  app2.post("/api/stripe/connect/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.session?.accessToken;
      if (!accessToken) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      const response = await fetch(`${BASE_URL2}/stripe/connect/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create Stripe Connect account"
      });
    }
  });
}

// ../shared-backend/server/routes.ts
async function registerRoutes(app2) {
  registerSettingsRoutes(app2);
  registerAuthRoutes(app2);
  registerAdminRoutes(app2);
  registerStripeRoutes(app2);
  registerCategoryRoutes(app2);
  registerProductRoutes(app2);
  registerAddressRoutes(app2);
  registerPaymentMethodRoutes(app2);
  registerDashboardRoutes(app2);
  registerOrderRoutes(app2);
  registerShowRoutes(app2);
  registerGiveawayRoutes(app2);
  registerShippingRoutes(app2);
  registerBundleRoutes(app2);
  registerReportRoutes(app2);
  const httpServer = createServer(app2);
  return httpServer;
}

// ../shared-backend/server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const clientRoot = path.resolve(process.cwd(), "client");
  console.log("[Vite] Using client root:", clientRoot);
  const appRoot = process.cwd();
  const viteConfigPath = path.resolve(appRoot, "vite.config.ts");
  const vite = await createViteServer({
    root: clientRoot,
    configFile: viteConfigPath,
    // Use the app's vite.config.ts
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// ../shared-backend/server/index.ts
var app = express2();
app.set("trust proxy", 1);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback-secret-for-development-only",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    // Set to false for now until SSL is properly configured
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  },
  name: "sessionId"
}));
app.use((req, res, next) => {
  const accessToken = req.headers["x-access-token"];
  const adminToken = req.headers["x-admin-token"];
  const userData = req.headers["x-user-data"];
  if (req.path === "/api/admin/users") {
    console.log("[Session Restoration] /api/admin/users request:");
    console.log("  - x-admin-token:", adminToken ? "present" : "missing");
    console.log("  - x-access-token:", accessToken ? "present" : "missing");
    console.log("  - x-user-data:", userData ? "present" : "missing");
    console.log("  - session.user:", req.session.user ? "exists" : "empty");
    console.log("  - session.accessToken:", req.session.accessToken ? "exists" : "empty");
  }
  if (accessToken && !req.session.accessToken) {
    req.session.accessToken = accessToken;
  }
  if (adminToken && !req.session.accessToken) {
    req.session.accessToken = adminToken;
  }
  if (userData && !req.session.user) {
    try {
      const decoded = Buffer.from(userData, "base64").toString("utf8");
      const parsedUser = JSON.parse(decoded);
      req.session.user = parsedUser;
      if (req.path === "/api/admin/users") {
        console.log("  - Restored user:", { admin: parsedUser.admin, id: parsedUser.id });
      }
    } catch (e) {
      console.error("Failed to parse user data from header:", e);
    }
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`
    });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

// server.ts
dotenv.config();
