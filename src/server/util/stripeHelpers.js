// imports
require("dotenv").config();
import config from "../util/config.js";
import errorHandler from './errorHandler.js';
import Stripe from 'stripe';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

function amountUsdToCents(amountUsd) {
  // convert amountUsd (decimal or string) to cents
  const cents = Math.ceil(parseFloat(amountUsd) * 100);
  return cents;
}

// ---------- CHARGES ---------- //

async function createStripeChargeForAmountUsd(amountUsd, description, token) {
  try {
    const chargeObj = await stripe.charges.create({
      amount: amountUsdToCents(amountUsd),
      currency: 'usd',
      description: description,
      source: token,
    });
    return chargeObj;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/createStripeChargeForAmountUsd");
    throw err;
  }
}

// ---------- CUSTOMERS ---------- //

async function createStripeCustomer(email, name, stripePaymentMethodId) {
  // create a stripe customer: https://stripe.com/docs/api/customers
  try {
    const customer = await stripe.customers.create({
      payment_method: stripePaymentMethodId,
      email,
      name, 
      invoice_settings: {
        default_payment_method: stripePaymentMethodId
      }
    });
    return customer;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/createStripeCustomer");
    throw err;
  }
}

// ---------- PLANS ---------- //

async function findStripePlanIdForAmountUsd(amountUsd) {
  // find stripe subscription plan_id for a given amount_usd
  // if not found, return null
  try {
    const conn = await config.dbInitConnectPromise();
    const [results, fields] = await conn.query(
      "SELECT stripe_plan_id from stripe_subscription_plans " +
      "WHERE amount_usd=?",
      [amountUsd]
    );
    if (results.length) {
      return results[0].stripe_plan_id;
    }
    return null;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/findStripePlanIdForAmountUsd");
    throw err;
  }
}

async function createNewStripePlanIdForAmountUsd(amountUsd) {
  // NOTE: amountUsd is a decimal (not cents)
  try {
    const conn = await config.dbInitConnectPromise();
    // use stripe API to create new plan with custom USD amount
    const plan = await stripe.plans.create({
      amount: amountUsdToCents(amountUsd),
      currency: 'usd',
      interval: 'month',
      product: process.env.STRIPE_SUBSCRIPTION_PRODUCT_ID,
    })
    // insert plan_id into our DB (stripe_subscription_plans table)
    const planId = plan.id;
    await conn.query(
      "INSERT INTO stripe_subscription_plans " +
      "(stripe_plan_id,amount_usd) " +
      "VALUES (?,?)",
      [planId, amountUsd]
    );
    return planId;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/createNewStripePlanIdForAmountUsd");
    throw err;
  }
}

async function getOrCreateStripePlanIdForAmountUsd(amountUsd) {
  try {
    let planId = await findStripePlanIdForAmountUsd(amountUsd);
    if (planId) {
      return planId;
    }
    planId = await createNewStripePlanIdForAmountUsd(amountUsd);
    return planId;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/getOrCreateStripePlanIdForAmountUsd");
    throw err;
  }
}

// ---------- SUBSCRIPTIONS ---------- //

async function createStripeSubscriptionFromCustomerIdAndPlanId(customerId, planId, metadata) {
  // create stripe subscription given customerId, planId
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ plan: planId }],
      expand: ["latest_invoice.payment_intent"],
      metadata,
    });
    return subscription;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/createStripeSubscriptionFromCustomerIdAndPlanId");
    throw err;
  }
}

async function createStripeSubscription(metadata, stripePaymentMethodId) {
  // create stripe subscription
  try {
    const { firstName, lastName, amount, email} = metadata;
    
    const customerName = `${firstName} ${lastName}`;
    
    const planId = await getOrCreateStripePlanIdForAmountUsd(amount); // create new plan if necessary
    const customer = await createStripeCustomer(email, customerName, stripePaymentMethodId);
    const subscription = await createStripeSubscriptionFromCustomerIdAndPlanId(customer.id, planId, metadata);
    return subscription;
  } catch (err) {
    errorHandler.handleError(err, "stripeHelpers/createStripeSubscriptionFromCustomerInfoAndAmountUsd");
    throw err;
  }
}

export default {
  // charges
  createStripeChargeForAmountUsd,

  // subscriptions
  createStripeSubscription
};
