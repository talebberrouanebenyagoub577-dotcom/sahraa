/**
 * SAHRAA sheet bridge.
 * Script properties: API_BASE, SHEET_SECRET
 * Columns must match templates/google-sheets/orders-template.csv
 */
var HEADERS = [
  "order_number", "created_at", "customer_name", "phone", "city", "items",
  "qty", "total", "currency", "payment_method", "has_upsell", "upsell_product",
  "status", "confirmation_notes", "courier", "tracking_number",
  "utm_source", "utm_campaign", "event_id", "synced_at"
];

function statusRank_(status) {
  var ranks = { new: 1, review: 2, confirmed: 3, shipped: 4, delivered: 5, returned: 5, cancelled: 6, refused: 6 };
  return ranks[String(status || "")] || 0;
}

function doPost(e) {
  var secret = props_().SHEET_SECRET;
  var incoming = (e && e.parameter && e.parameter.secret) || "";
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    body = {};
  }
  if (!incoming) incoming = body.secret || "";
  if (!secret || incoming !== secret) {
    return json_({ ok: false, error: "unauthorized" });
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureHeaders_(sheet);
  var row = findRow_(sheet, body.orderNumber || body.order_number);
  var values = HEADERS.map(function (key) {
    if (key === "order_number") return body.orderNumber || body.order_number || "";
    if (key === "created_at") return body.createdAt || body.created_at || "";
    if (key === "customer_name") return body.customerName || "";
    if (key === "phone") return body.customerPhone || body.phone || "";
    if (key === "items") return formatItems_(body.items);
    if (key === "qty") return body.qty || qtyOf_(body.items);
    if (key === "total") return body.total || "";
    if (key === "has_upsell") return body.hasUpsell ? "yes" : "no";
    if (key === "upsell_product") return body.upsellProduct || "";
    if (key === "payment_method") return body.paymentMethod || "COD";
    if (key === "status") return body.status || "new";
    if (key === "confirmation_notes") return body.confirmation_notes || body.confirmationNotes || "";
    if (key === "event_id") return body.eventId || body.event_id || "";
    return body[key] || "";
  });
  if (row) {
    var statusCol = HEADERS.indexOf("status");
    var eventCol = HEADERS.indexOf("event_id");
    var currentStatus = String(sheet.getRange(row, statusCol + 1).getValue() || "");
    var incomingStatus = String(values[statusCol] || "");
    if (currentStatus && statusRank_(incomingStatus) < statusRank_(currentStatus)) values[statusCol] = currentStatus;
    var currentEvent = String(sheet.getRange(row, eventCol + 1).getValue() || "");
    if (!values[eventCol] && currentEvent) values[eventCol] = currentEvent;
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
  return json_({ ok: true });
}

function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getIndex() !== 1) return;
  var col = e.range.getColumn();
  var watched = ["status", "courier", "tracking_number", "confirmation_notes"];
  var header = String(sheet.getRange(1, col).getValue());
  if (watched.indexOf(header) === -1) return;
  var row = e.range.getRow();
  if (row < 2) return;
  pushRow_(sheet, row);
}

function pushRow_(sheet, row) {
  var map = rowMap_(sheet, row);
  if (!map.order_number) return;
  var config = props_();
  var res = UrlFetchApp.fetch(config.API_BASE + "/v1/orders/sheet-sync", {
    method: "post",
    contentType: "application/json",
    headers: { "X-Sheet-Secret": config.SHEET_SECRET },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      orderNumber: map.order_number,
      status: map.status,
      confirmationNotes: map.confirmation_notes,
      courier: map.courier,
      trackingNumber: map.tracking_number
    })
  });
  if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
    var syncedCol = HEADERS.indexOf("synced_at") + 1;
    sheet.getRange(row, syncedCol).setValue(new Date().toISOString());
  }
}

function ensureHeaders_(sheet) {
  if (!sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function findRow_(sheet, orderNumber) {
  var last = sheet.getLastRow();
  if (last < 2 || !orderNumber) return 0;
  var values = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(orderNumber)) return i + 2;
  }
  return 0;
}

function rowMap_(sheet, row) {
  var headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var map = {};
  headers.forEach(function (header, index) { map[header] = values[index]; });
  return map;
}

function formatItems_(items) {
  if (!items || !items.length) return "";
  return items.map(function (item) {
    return item.name + " ×" + item.quantity;
  }).join(" | ");
}

function qtyOf_(items) {
  if (!items) return "";
  return items.reduce(function (sum, item) { return sum + Number(item.quantity || 0); }, 0);
}

function props_() {
  var script = PropertiesService.getScriptProperties();
  return {
    API_BASE: script.getProperty("API_BASE") || "https://api.sahraaaaaaaaaaa.shop",
    SHEET_SECRET: script.getProperty("SHEET_SECRET") || ""
  };
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
