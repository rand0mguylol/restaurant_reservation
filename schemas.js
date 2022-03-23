// const JoiDate = require("@joi/date")
const Joi = require("joi").extend(require('@joi/date'));
const sanitizeHtml = require("sanitize-html");

const sanitizeData = (value, helper) => {

      sanitizedValue = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
            disallowedTagsMode: 'discard',
      });
      return sanitizedValue
}

const trimValue  = (value, helper) => {
      return value.trim()
}

const checkTimeRange = (value, helper) => {
  const timeList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]

  if(! timeList.includes(value)){
    return helper.message("Invalid Contact Number")
  }

  return value
}

module.exports.reserveSchema = Joi.object({
  firstName: Joi.string()
  .required()
  .alphanum()
  .custom(trimValue)
  .custom(sanitizeData)
  .messages({
    "any.required": "First Name is required",
    "string.empty": "First Name must not be empty",
}),

  lastName: Joi.string()
    .required()
    .alphanum()
    .custom(trimValue)
    .custom(sanitizeData)
    .messages({
      "any.required": "Last Name is required",
      "string.empty": "Last Name must not be empty",
  }),

  email: Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
  .required()
  .custom(sanitizeData)
  .messages({
        "any.required": "Email is required",
        "string.empty": "Email must not be empty",
        "string.email": "Email is invalid"
  }),

  contactNumber: Joi.string()
    .pattern(new RegExp('^[0-9]{3}-[0-9]{7,8}$'))
    .required()
    .messages({
      "any.required": "Contact Number is required",
      "string.empty": "Contact Number must not be empty",
      "string.email": "Email is invalid",
      "string.pattern.base": "Contact Number is invalid"
    }),

  bookingDate: Joi.date()
    .format('YYYY-MM-DD')
    .min("now")
    .required()
    .messages({
      "any.required": "Booking Date is required",
      "date.format": "Invalid Date",
      "date.min": "Invalid Date"
    }),
  
  bookingTime: Joi.string()
    .pattern(new RegExp('^[0-2]{1}[0-9]{1}:[0-6]{1}[0-9]{1}$'))
    .messages({
      "any.required": "Booking Time is required",
      "string.pattern.base": "Booking Time is invalid"
    }),

  pax: Joi.number()
  .integer()
  .min(1)
  .max(100)
  .messages({
    "any.required": "Pax is required",
    "number.min": "Pax is invalid",
    "number.integer": "Pax is invalid"
  }),

  specialInstruction: Joi.string()
  .custom(trimValue)
  .custom(sanitizeData)
  .allow('', null)
})