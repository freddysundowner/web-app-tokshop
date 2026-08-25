const addressModel = require("../models/address");
const userModel = require("../models/user");
const { Shippo } = require("shippo");
const { parsePhoneNumberFromString } = require("libphonenumber-js")
const functions = require("../shared/functions");


var mongoose = require("mongoose");

exports.validateAddress = async (req, res) => {
  console.log("validateAddress");
  const { shippo_api_key } = await functions.getSettings();
  if (shippo_api_key == "") {
    return res
      .status(400)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, detail: "Shippo API key is not set" });
  }
  try {
    console.log(req.body)
    const shippo = new Shippo({
      apiKeyHeader: shippo_api_key,
    });
    const address = await shippo.addresses.create({
      ...req.body,
      validate: true,
    });
    console.log(address);
    if (!address?.validationResults?.isValid) {
      console.log(address?.validationResults?.messages);
      let messages = address?.validationResults?.messages;
      if (messages?.length > 0) {
        return res
          .status(400)
          .setHeader("Content-Type", "application/json")
          .json({ success: false, error: messages[0].text });
      }
      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: false, error: "Address is not valid" });
    }
    return res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true });
  } catch (error) {
    let simpleError = { message: "Something went wrong" };

    if (error?.body) {
      try {
        simpleError = JSON.parse(error.body);
      } catch (_) { }
    }
    console.log(simpleError);

    return res
      .status(error?.statusCode || 500)
      .json(simpleError);
  }
}

exports.addAddress = async (req, res) => {
  try {
      console.log(req.body);
    const phoneNumber = parsePhoneNumberFromString(
      req.body.phone,
      req.body.countryCode
    );

    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is not valid",
      });
    }

    const { shippo_api_key } = await functions.getSettings();

    if (!shippo_api_key) {
      return res.status(400).json({
        success: false,
        message: "Shippo API key is not set",
      });
    }

    const axios = require("axios");
    if (req.body.email == null || req.body.email == "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const validationResponse = await axios.get(
      "https://api.goshippo.com/v2/addresses/validate",
      {
        headers: {
          Authorization: `ShippoToken ${shippo_api_key}`,
        },
        params: {
          name: req.body.name,
          address_line_1: req.body.addrress1,
          address_line_2: req.body.addrress2 || "",
          city_locality: req.body.city,
          state_province: req.body.stateCode || req.body.state,
          postal_code: req.body.zipcode,
          country_code: req.body.countryCode,
          phone: phoneNumber.number,
          email: req.body.email,
        },
      }
    );

    const result = validationResponse.data;
    console.log("Shippo validation result:", result);

    const validationValue = result?.analysis?.validation_result?.value;
    const reasons = result?.analysis?.validation_result?.reasons || [];
    console.log("Shippo validation reasons:", reasons);

    const isAccepted =
      validationValue === "valid" || validationValue === "partially_valid";

    if (!isAccepted) {
      return res.status(400).json({
        success: false,
        message: reasons[0] || "Address is not valid",
      });
    }

    const recommended = result?.recommended_address || {};
    const original = result?.original_address || {};

    const finalAddress = {
      name: recommended.name || original.name || req.body.name,
      addrress1:
        recommended.address_line_1 || original.address_line_1 || req.body.addrress1,
      addrress2:
        recommended.address_line_2 || original.address_line_2 || req.body.addrress2 || "",
      city:
        recommended.city_locality || original.city_locality || req.body.city,
      state:
        recommended.state_province ||
        original.state_province ||
        req.body.stateCode ||
        req.body.state,
      zipcode:
        recommended.postal_code || original.postal_code || req.body.zipcode,
      countryCode:
        recommended.country_code || original.country_code || req.body.countryCode,
      phone: phoneNumber.number,
      email: req.body.email,
    };

    const hasPrimary = await addressModel.exists({
      userId: req.body.userId,
      primary: true,
    });

    const newAddress = await addressModel.create({
      userId: req.body.userId,
      primary: !hasPrimary,
      ...finalAddress,
    });

    if (!hasPrimary) {
      await userModel.findByIdAndUpdate(
        req.body.userId,
        { $set: { address: newAddress._id } },
        { runValidators: true, new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        validationValue === "partially_valid"
          ? "Address was corrected and saved"
          : "Address saved successfully",
      corrected: validationValue === "partially_valid",
      validation: validationValue,
      data: newAddress,
      recommendedAddress: result?.recommended_address || null,
    });
  } catch (error) {
    console.log(error);

    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    return res.status(error?.response?.status || 422).json({
      success: false,
      message,
    });
  }
};

exports.getAddressByUserId = async (req, res) => {
  try {
    let Addresses = await addressModel
      .find({ userId: req.params.userId })
      .populate("userId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ]);
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(Addresses);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.getDefaultAddressByUserId = async (req, res) => {
  try {
    let Addresses = await addressModel
      .findOne({ userId: req.params.userId, primary: true })
      .populate("userId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ]);
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(Addresses);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.makeAddressPrimary = async (req, res) => {
  const { userId } = req.body;
  const { addressId } = req.params;

  try {
    // Step 1: Clear any other primaries for the user
    await addressModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), primary: true },
      { $set: { primary: false } }
    );

    // Step 2: Set the chosen address as primary
    const updatedAddress = await addressModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId), userId: new mongoose.Types.ObjectId(userId) },
      { $set: { primary: true } },
      { new: true, runValidators: true }
    );
    await userModel.findByIdAndUpdate(userId, { address: addressId })
    if (!updatedAddress) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    console.error(error);
    res.status(422).json({ success: false, message: error.message });
  }
};

exports.updateAddressById = async (req, res) => {
  console.log(req.body);
  try {

    let data = {
      ...req.body,
      validate: true,
      country: req.body.countryCode,
      street1: req.body.addrress1,
      street2: req.body.addrress2,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zipcode,
    };
    const phoneNumber = parsePhoneNumberFromString(req.body.phone, req.body.countryCode);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return res
        .status(400)
        .setHeader("Content-Type", "application/json")
        .json({ success: false, message: "Phone number is not valid" });
    }
    const { shippo_api_key } = await functions.getSettings();
    const shippo = new Shippo({
      apiKeyHeader: shippo_api_key,
    });
    const address = await shippo.addresses.create(data);
    console.log(address);
    if (address.validationResults != undefined && Object.keys(address.validationResults).length > 0 && !address?.validationResults?.isValid) {
      return res
        .status(400)
        .setHeader("Content-Type", "application/json")
        .json({ success: false, message: address?.validationResults?.messages[0].text });
    }
    const standardized = address;
    let add = {
      name: standardized.name,
      phone: phoneNumber.number,
      email: standardized.email,
      addrress1: standardized.street1,
      addrress2: standardized.street2 || req.body.addrress2,
      city: standardized.city,
      state: standardized.state,
      zipcode: standardized.zip,
      countryCode: standardized.country,
    }
    let updatedAddress = await addressModel.findByIdAndUpdate(
      req.params.addressId,
      { $set: add },
      { runValidators: true, new: true }
    );
    console.log("updated ", updatedAddress)
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: updatedAddress });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, message: error.message });
  }
};
exports.getAddressById = async (req, res) => {
  try {
    let Address = await addressModel
      .findById(req.params.addressId)
      .populate("userId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(Address);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.deleteAddressById = async (req, res) => {
  try {
    await addressModel.findByIdAndDelete(req.params.addressId);
    res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false });
  }
};

exports.createTestAddress = async (userId) => {
  let data = {
    addrress1: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94117",
    primary: true,
    addrress2: "Kanu Street",
    cityCode: "test",
    country: "US",
    countryCode: "KE",
    zipcode: "94117",
    street: "test",
    phone: "1234567890",
    userId: userId,
    name: "John Doe",
    email: "dYk0i@example.com"
  };
  let newAddress = await addressModel.create(data);

  await userModel.findByIdAndUpdate(
    userId,
    { $set: { address: newAddress._id } },
    { runValidators: true, new: true }
  );
};
