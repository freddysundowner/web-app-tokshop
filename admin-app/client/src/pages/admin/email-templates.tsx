import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Save, DollarSign, Package, Truck, Eye, RotateCcw, KeyRound, BarChart3, UserCheck, Smartphone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  recipients: string[];
  icon: any;
  variables: { name: string; description: string }[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "payment_available",
    name: "Payment Available",
    description: "Sent to seller when payment is available for withdrawal",
    subject: "💰 Your payment is ready for withdrawal - {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">💰</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Payment Ready for Withdrawal!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, great news! Your earnings are now available for withdrawal.
              </p>
            </td>
          </tr>
          <!-- Amount Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #166534; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Available for Withdrawal</p>
                    <p style="color: #15803d; font-size: 36px; font-weight: 700; margin: 0;">{{amount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{dashboard_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Withdraw Now</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for selling with us!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller"],
    icon: DollarSign,
    variables: [
      { name: "name", description: "Seller's name" },
      { name: "amount", description: "Withdrawal amount" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "dashboard_url", description: "Seller dashboard URL" },
    ],
  },
  {
    id: "order_received",
    name: "Order Received",
    description: "Sent to both seller and customer when an order is placed",
    subject: "📦 Order Confirmed - {{order_id}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto;">
                <span style="font-size: 40px; line-height: 80px;">📦</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Order Confirmed!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{recipient_name}}, {{message}}
              </p>
            </td>
          </tr>
          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</p>
                    <!-- Product Row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="width: 60px; vertical-align: top;">
                          <div style="width: 50px; height: 50px; background-color: #e4e4e7; border-radius: 8px;"></div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="color: #18181b; font-size: 14px; font-weight: 500; margin: 0 0 4px;">{{product_name}}</p>
                          <p style="color: #71717a; font-size: 13px; margin: 0;">Qty: {{quantity}}</p>
                        </td>
                        <td style="vertical-align: top; text-align: right;">
                          <p style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0;">{{total_amount}}</p>
                        </td>
                      </tr>
                    </table>
                    <!-- Divider -->
                    <div style="height: 1px; background-color: #e4e4e7; margin: 16px 0;"></div>
                    <!-- Order ID -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 14px;">Order ID</td>
                        <td style="color: #18181b; font-size: 14px; text-align: right; font-weight: 500;">{{order_id}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">📍 Shipping Address</p>
                    <p style="color: #18181b; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">{{shipping_address}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{order_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Order Details</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Questions? We're here to help!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller", "Customer"],
    icon: Package,
    variables: [
      { name: "recipient_name", description: "Recipient's name" },
      { name: "message", description: "Custom message based on recipient type" },
      { name: "order_id", description: "Order ID" },
      { name: "product_name", description: "Product name" },
      { name: "quantity", description: "Quantity ordered" },
      { name: "total_amount", description: "Total order amount" },
      { name: "shipping_address", description: "Shipping address" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "order_url", description: "Order details URL" },
    ],
  },
  {
    id: "order_shipped",
    name: "Order Shipped",
    description: "Sent to customer when order is shipped",
    subject: "🚚 Your order is on its way! - {{order_id}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #8b5cf6; border-radius: 50%; margin: 0 auto;">
                <span style="font-size: 40px; line-height: 80px;">🚚</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Your Order Has Shipped!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{customer_name}}, great news! Your package is on its way.
              </p>
            </td>
          </tr>
          <!-- Tracking Info -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border: 2px solid #8b5cf6; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #6b21a8; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">{{carrier}}</p>
                    <p style="color: #581c87; font-size: 18px; font-weight: 600; margin: 0 0 16px; font-family: monospace; letter-spacing: 2px;">{{tracking_number}}</p>
                    <a href="{{tracking_url}}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">Track Package</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Delivery Estimate -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">📅 Estimated Delivery</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 600;">{{estimated_delivery}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">📦 Product</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 500;">{{product_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0;">🏷️ Order ID</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">{{order_id}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">📍 Delivering To</p>
                    <p style="color: #18181b; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">{{shipping_address}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for shopping with us!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Customer"],
    icon: Truck,
    variables: [
      { name: "customer_name", description: "Customer's name" },
      { name: "order_id", description: "Order ID" },
      { name: "product_name", description: "Product name" },
      { name: "carrier", description: "Shipping carrier name" },
      { name: "tracking_number", description: "Tracking number" },
      { name: "tracking_url", description: "Tracking URL" },
      { name: "estimated_delivery", description: "Estimated delivery date" },
      { name: "shipping_address", description: "Shipping address" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "password_reset",
    name: "Password Reset",
    description: "Sent to user when they request a password reset",
    subject: "Reset Your Password - {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #f59e0b; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#128274;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Password Reset Request</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, we received a request to reset your password. Click the button below to create a new password.
              </p>
            </td>
          </tr>
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #92400e; font-size: 14px; margin: 0 0 8px;">This link will expire in</p>
                    <p style="color: #78350f; font-size: 24px; font-weight: 700; margin: 0;">{{expiry_time}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <a href="{{reset_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
            </td>
          </tr>
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: {{primary_color}}; font-size: 12px; line-height: 1.6; margin: 8px 0 0; text-align: center; word-break: break-all;">
                {{reset_url}}
              </p>
            </td>
          </tr>
          <!-- Security Warning -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                      If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Need help? We're here for you!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["User"],
    icon: KeyRound,
    variables: [
      { name: "name", description: "User's name" },
      { name: "reset_url", description: "Password reset link URL" },
      { name: "expiry_time", description: "Time until link expires (e.g., '1 hour')" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "show_analytics",
    name: "Live Show Stats",
    description: "Sent to seller after a live show ends with performance analytics",
    subject: "Your Show Analytics - {{show_title}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #667eea; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; line-height: 80px;">&#128202;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Your Show Analytics</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 8px; text-align: center; font-weight: 600;">
                {{show_title}}
              </p>
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                {{show_time}}
              </p>
            </td>
          </tr>
          <!-- Metrics Grid -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Show Analytics</p>
                    <!-- Items Sold -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Items Sold</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{items_sold}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Giveaways -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Giveaways</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{giveaways}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Shipments -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Shipments</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{shipments}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Total Sales -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Total Sales</td>
                              <td style="color: #10b981; font-size: 22px; font-weight: 700; text-align: right;">{{total_sales}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Tips Received -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Tips Received</td>
                              <td style="color: #8b5cf6; font-size: 22px; font-weight: 700; text-align: right;">{{tips_received}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Viewers -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Viewers</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{viewers}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- New Followers -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">New Followers</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{new_followers}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{show_analytics_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Start Shipping</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for hosting on {{app_name}}!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller"],
    icon: BarChart3,
    variables: [
      { name: "show_title", description: "Live show title" },
      { name: "show_time", description: "Show date and time" },
      { name: "items_sold", description: "Number of items sold" },
      { name: "giveaways", description: "Number of giveaways" },
      { name: "shipments", description: "Number of shipments" },
      { name: "total_sales", description: "Total sales amount (e.g., $245.00)" },
      { name: "tips_received", description: "Tips received amount (e.g., $25.00)" },
      { name: "viewers", description: "Number of viewers" },
      { name: "new_followers", description: "Number of new followers" },
      { name: "show_analytics_url", description: "Link to shipping/analytics page" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "seller_approval",
    name: "Seller Approval",
    description: "Sent to user when their seller application is approved",
    subject: "Congratulations! You're Approved to Sell on {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; line-height: 80px;">&#10004;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">You're Approved!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, congratulations! Your seller application has been approved. You now have access to the Seller Hub where you can list products, host live shows, and start selling!
              </p>
            </td>
          </tr>
          <!-- What's Next Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #166534; font-size: 14px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">What's Next?</p>
                    <ul style="color: #15803d; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Set up your seller profile</li>
                      <li>Add your first products</li>
                      <li>Configure shipping options</li>
                      <li>Schedule your first live show</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{seller_hub_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Go to Seller Hub</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Welcome to the {{app_name}} seller community!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["User"],
    icon: UserCheck,
    variables: [
      { name: "name", description: "User's name" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "seller_hub_url", description: "Link to seller hub/dashboard" },
    ],
  },
  {
    id: "app_update",
    name: "App Update",
    description: "Notify users about a new app version available",
    subject: "New Update Available - {{app_name}} v{{version}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; line-height: 80px;">&#128241;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">New Version Available!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, a new version of {{app_name}} is now available! Update to version {{version}} to enjoy the latest features and improvements.
              </p>
            </td>
          </tr>
          <!-- Version Info -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Latest Version</p>
                    <p style="color: #1d4ed8; font-size: 36px; font-weight: 700; margin: 0;">v{{version}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- What's New -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">What's New</p>
                    <p style="color: #18181b; font-size: 14px; line-height: 1.8; margin: 0; white-space: pre-line;">{{whats_new}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Download Buttons -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px; text-align: center;">
                    <a href="{{android_link}}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 4px;">Update on Android</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; text-align: center;">
                    <a href="{{ios_link}}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 4px;">Update on iOS</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for using {{app_name}}!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["All Users"],
    icon: Smartphone,
    variables: [
      { name: "name", description: "User's name" },
      { name: "version", description: "New app version number" },
      { name: "whats_new", description: "List of new features/changes" },
      { name: "android_link", description: "Google Play Store link" },
      { name: "ios_link", description: "Apple App Store link" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
];

export default function EmailTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [activeTab, setActiveTab] = useState("payment_available");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: "", body: "" });

  const { data: savedTemplatesData, isLoading } = useQuery<any>({
    queryKey: ['/api/templates'],
  });

  useEffect(() => {
    if (savedTemplatesData?.success && savedTemplatesData?.data) {
      const apiTemplates = Array.isArray(savedTemplatesData.data) ? savedTemplatesData.data : [savedTemplatesData.data];
      if (apiTemplates.length > 0) {
        setTemplates(prev => prev.map(defaultTemplate => {
          const savedTemplate = apiTemplates.find((t: any) => t.slug === defaultTemplate.id);
          if (savedTemplate) {
            return {
              ...defaultTemplate,
              body: savedTemplate.htmlContent || defaultTemplate.body,
            };
          }
          return defaultTemplate;
        }));
      }
    }
  }, [savedTemplatesData]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const payload = {
        name: template.name,
        slug: template.id,
        htmlContent: template.body,
        placeholders: template.variables.map(v => v.name),
      };
      return apiRequest("POST", "/api/templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template saved",
        description: "Email template has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving template",
        description: error.message || "Failed to save email template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const payload = {
        name: template.name,
        slug: template.id,
        htmlContent: template.body,
        placeholders: template.variables.map(v => v.name),
      };
      return apiRequest("PUT", `/api/templates/${template.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating template",
        description: error.message || "Failed to update email template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully",
      });
      // Switch to first available template
      if (templates.length > 1) {
        const remaining = templates.filter(t => t.id !== activeTab);
        if (remaining.length > 0) {
          setActiveTab(remaining[0].id);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.message || "Failed to delete email template",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleTemplateChange = (templateId: string, field: 'subject' | 'body', value: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, [field]: value } : t
    ));
  };

  const handleSaveTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      saveTemplateMutation.mutate(template);
    }
  };

  const handleResetToDefault = (templateId: string) => {
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
    if (defaultTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...defaultTemplate } : t
      ));
      toast({
        title: "Template reset",
        description: "Template has been reset to default. Click 'Save Template' to save changes.",
      });
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    const sampleData: Record<string, string> = {
      name: "John Doe",
      customer_name: "Jane Smith",
      recipient_name: "Jane Smith",
      message: "your order has been confirmed and is being processed.",
      amount: "$245.00",
      order_id: "ORD-12345",
      product_name: "Vintage Watch",
      quantity: "1",
      total_amount: "$55.99",
      carrier: "USPS",
      tracking_number: "9400111899223456789012",
      tracking_url: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223456789012",
      estimated_delivery: "December 28, 2025",
      shipping_address: "123 Main St<br>Anytown, CA 12345",
      app_name: "Your Store",
      support_email: "support@yourstore.com",
      primary_color: "#F43F5E",
      secondary_color: "#0D9488",
      dashboard_url: "#",
      order_url: "#",
      reset_url: "https://yourstore.com/reset-password?token=abc123xyz",
      expiry_time: "1 hour",
      show_title: "Friday Night Live Sale",
      show_time: "December 27, 2025 at 8:00 PM",
      items_sold: "24",
      giveaways: "3",
      shipments: "18",
      total_sales: "$1,245.00",
      tips_received: "$85.50",
      viewers: "156",
      new_followers: "12",
      show_analytics_url: "#",
    };

    let previewSubject = template.subject;
    let previewBody = template.body;

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewBody = previewBody.replace(regex, value);
    });

    setPreviewContent({ subject: previewSubject, body: previewBody });
    setPreviewOpen(true);
  };

  const currentTemplate = templates.find(t => t.id === activeTab);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Customize the email templates sent to sellers and customers
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <TabsTrigger
                  key={template.id}
                  value={template.id}
                  className="flex items-center gap-2"
                  data-testid={`tab-${template.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {template.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {templates.map((template) => (
            <TabsContent key={template.id} value={template.id}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {template.name}
                          </CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {template.recipients.map((recipient) => (
                            <Badge key={recipient} variant="secondary">
                              {recipient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`subject-${template.id}`}>Subject Line</Label>
                        <Input
                          id={`subject-${template.id}`}
                          value={template.subject}
                          onChange={(e) => handleTemplateChange(template.id, 'subject', e.target.value)}
                          placeholder="Email subject"
                          data-testid={`input-subject-${template.id}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`body-${template.id}`}>Email Body</Label>
                        <Textarea
                          id={`body-${template.id}`}
                          value={template.body}
                          onChange={(e) => handleTemplateChange(template.id, 'body', e.target.value)}
                          placeholder="Email body content"
                          className="min-h-[400px] font-mono text-sm"
                          data-testid={`textarea-body-${template.id}`}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleSaveTemplate(template.id)}
                          disabled={saveTemplateMutation.isPending}
                          data-testid={`button-save-${template.id}`}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleResetToDefault(template.id)}
                          data-testid={`button-reset-${template.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to Default
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                          data-testid={`button-delete-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handlePreview(template)}
                              data-testid={`button-preview-${template.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Email Preview</DialogTitle>
                              <DialogDescription>
                                Preview with sample data and branding colors
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="border rounded-lg p-4 bg-muted/50">
                                <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                                <p className="font-medium">{previewContent.subject}</p>
                              </div>
                              <div className="border rounded-lg overflow-hidden">
                                <iframe
                                  srcDoc={previewContent.body}
                                  title="Email Preview"
                                  className="w-full h-[600px] border-0"
                                  sandbox="allow-same-origin"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Available Variables</CardTitle>
                      <CardDescription>
                        Use these placeholders in your template
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {template.variables.map((variable) => (
                          <div key={variable.name} className="text-sm">
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {"{{" + variable.name + "}}"}
                            </code>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {variable.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
