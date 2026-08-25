const roomsModel = require("../models/room");
const { sendEmail } = require('./email');
const EmailTemplate = require("../models/templates");
const ThemeSettings = require("../models/themes");
const functions = require("./functions");
var orderModel = require("../models/order");
function convertToHex(color) {
  if (!color) return '#000000';
  if (color.length === 8 && color.startsWith('FF')) {
    return '#' + color.substring(2);
  }
  return color.startsWith('#') ? color : '#' + color;
}

function replacePlaceholders(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function sendShowAnalyticsEmail(roomId) {
  // try {
  console.log(`📧 [Analytics Email] Processing for room: ${roomId}`);

  const themesettings = await ThemeSettings.findOne({});

  let room = await roomsModel.findById(roomId).populate("owner", ["email"]);

  let ownerEmail = room?.owner?.email;
  if (!ownerEmail) {
    console.error('❌ [Analytics Email] Room owner email not found');
    return;
  }
  const orderMetrics = await orderModel.aggregate([
    {
      $match: {
        tokshow: room._id,
        status: { $nin: ["cancelled", "refunded"] }
      }
    },

    {
      $group: {
        _id: null,

        totalSales: {
          $sum: "$subtotal"
        },

        totalEarnings: {
          $sum: "$earnings"
        },

        totalShippingFees: {
          $sum: "$seller_shipping_fee_pay"
        },

        totalServiceFees: {
          $sum: "$service_fee"
        },

        totalStripeFees: {
          $sum: "$stripe_fees"
        },

        totalOrders: {
          $sum: 1
        }
      }
    }
  ]);
  const metrics = orderMetrics[0] || {
    totalSales: 0,
    totalEarnings: 0,
    totalShippingFees: 0,
    totalServiceFees: 0,
    totalStripeFees: 0,
    totalOrders: 0
  };
  const data = {
    show_title: room.title || "Your Show",

    show_time: new Date().toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),

    items_sold: room.salesCount || 0,

    giveaways: room.giveawayCount || 0,

    shipments: room.shipmentsCount || 0,

    total_sales: `$${metrics.totalSales.toFixed(2)}`,

    total_earned: `$${metrics.totalEarnings.toFixed(2)}`,

    shipping_fees: `$${metrics.totalShippingFees.toFixed(2)}`,

    service_fees: `$${metrics.totalServiceFees.toFixed(2)}`,

    stripe_fees: `$${metrics.totalStripeFees.toFixed(2)}`,

    tips_received: `$${(room.tipsTotal || 0).toFixed(2)}`,

    viewers: room.viewers?.length || 0,

    new_followers: room.followersCount || 0,

    show_analytics_url: `${themesettings?.website_url ||
      'https://seller.iconaapp.com'
      }/shipping`,
  };
  console.log(`📧 [Analytics Email] Sending to: ${ownerEmail}`);
  await sendEmail(data, ownerEmail, "show_analytics");

  console.log(`✅ [Analytics Email] Successfully sent to ${ownerEmail}`);

  // } catch (error) {
  //   console.error(`❌ [Analytics Email] Error:`, error.message);
  // }
}

module.exports = { sendShowAnalyticsEmail, replacePlaceholders };