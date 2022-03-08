const saito = require('./../../lib/saito/saito');
const ModTemplate = require('../../lib/templates/modtemplate');
const MixinAppspace = require('./lib/email-appspace/mixin-appspace');
const SaitoOverlay = require("../../lib/saito/ui/saito-overlay/saito-overlay");
const fetch = require('node-fetch');
const forge = require('node-forge');
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

class Mixin extends ModTemplate {

  constructor(app) {

    super(app);

    this.name = "Mixin";
    this.description = "Adding support for Mixin Network on Saito";
    this.categories = "Finance Utilities";
    
  }
  
  respondTo(type = "") {

    if (type == 'email-appspace') {
      let obj = {};
      obj.render = function (app, data) {
        MixinAppspace.render(app, data);
      }
      obj.attachEvents = function (app, data) {
        MixinAppspace.attachEvents(app, data);
      }
      return obj;
    }

    return null;
  }


  initialize(app) {

/****
    //
    // WORKS - our private-key can query profiles @ /me
    //
    const appId = '9be2f213-ca9d-4573-80ca-3b2711bb2105';
    const sessionId = 'f072cd2a-7c81-495c-8945-d45b23ee6511';
    const privateKey = 'dN7CgCxWsqJ8wQpQSaSnrE0eGsToh7fntBuQ5QvVnguOdDbcNZwAMwsF-57MtJPtnlePrNSe7l0VibJBKD62fg';
    const method = 'GET';
    const uri = '/me';
    const token = this.signAuthenticationToken(appId, sessionId, privateKey, method, uri);
    console.log(token);

    try {
      this.request(appId, sessionId, privateKey, method, uri).then(
        (res) => {
          console.log("RETURNED DATA: " + JSON.stringify(res.data));
        }
      );
    } catch (err) {
      console.log("ERROR: Mixin error sending network request: " + err);
    }
****/

/***
    //
    // WORKS - we can create Mixin network users @ /users
    //
    const appId = '9be2f213-ca9d-4573-80ca-3b2711bb2105';
    const sessionId = 'f072cd2a-7c81-495c-8945-d45b23ee6511';
    const privateKey = 'dN7CgCxWsqJ8wQpQSaSnrE0eGsToh7fntBuQ5QvVnguOdDbcNZwAMwsF-57MtJPtnlePrNSe7l0VibJBKD62fg';

    const user_keypair = forge.pki.ed25519.generateKeyPair();
    const original_user_public_key = user_keypair.publicKey.toString('base64');
    const original_user_private_key = user_keypair.privateKey.toString('base64');
    const user_public_key = this.base64RawURLEncode(user_keypair.publicKey.toString('base64'));
    const user_private_key = this.base64RawURLEncode(user_keypair.privateKey.toString('base64'));


    const method = "POST";
    const uri = '/users'; 
    const body = {
      session_secret: user_public_key,
      full_name: "Saito Test User 16",
    };

    console.log("ORIG USER PUBKEY: "+original_user_public_key);
    console.log("PRIG USER PRVKEY: "+original_user_private_key);
    console.log("URI USER PUBKEY: "+user_public_key.toString('base64'));
    console.log("URI USER PRVKEY: "+user_private_key.toString('base64'));

    try {
      this.request(appId, sessionId, privateKey, method, uri, body).then(
        (res) => {
          console.log("RETURNED DATA: " + JSON.stringify(res.data));
        }
      );
    } catch (err) {
      console.log("ERROR: Mixin error sending network request: " + err);
    }
***/


/****
    //
    // FAILS - our new user cannot query their profile @ /me
    //
    const appId = '9be2f213-ca9d-4573-80ca-3b2711bb2105';
    const sessionId = 'bdd2e1cc-6e66-4ff6-a69b-bda661e7bd81';
    const privateKey = 'HkHtQ5KItj9lbmuTTxnfFvOvJBNH09M7EES/pd7QQGmw/1kBViHNIxZZ++Jrji6+FioVGWIWms993OZrPQ2h5A==';
    const method = 'GET';
    const uri = '/me';
    const token = this.signAuthenticationToken(appId, sessionId, privateKey, method, uri);
    console.log(token);

    try {
      this.request(appId, sessionId, privateKey, method, uri).then(
        (res) => {
          console.log("RETURNED DATA: " + JSON.stringify(res.data));
        }
      );
    } catch (err) {
      console.log("ERROR: Mixin error sending network request: " + err);
    }


  }


  base64RawURLEncode(buffer) {
    return buffer.toString('base64').replace(/\=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  requestByTokenNoData(method, path, accessToken) {
    return axios({
      method,
      url: 'https://mixin-api.zeromesh.net' + path,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    })
  }

  requestByToken(method, path, data, accessToken) {
    return axios({
      method,
      url: 'https://mixin-api.zeromesh.net' + path,
      data,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    })
  }

  request(uid, sid, privateKey, method, path, data=null) {
    const m = method;
    let accessToken = '';
    if (data == null) {
      accessToken = this.signAuthenticationToken(
        uid,
        sid,
        privateKey,
        method,
        path
      )
      return this.requestByTokenNoData(method, path, accessToken);
    } else {
      accessToken = this.signAuthenticationToken(
        uid,
        sid,
        privateKey,
        method,
        path,
        JSON.stringify(data)
      )
      return this.requestByToken(method, path, data, accessToken);
    }
  }

  signAuthenticationToken(uid, sid, privateKey, method, uri, params, scp) {
    privateKey = Buffer.from(privateKey, 'base64')
    method = method.toLocaleUpperCase()
    if (typeof params === 'object') {
      params = JSON.stringify(params)
    } else if (typeof params !== 'string') {
      params = ''
    }

    let iat = Math.floor(Date.now() / 1000)
    let exp = iat + 3600
    let md = forge.md.sha256.create()
    md.update(method + uri + params, 'utf8')
    let payload = {
      uid: uid,
      sid: sid,
      iat: iat,
      exp: exp,
      jti: uuidv4(),
      sig: md.digest().toHex(),
      scp: scp || 'FULL',
    }

    let header = this.base64RawURLEncode(Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT" }), 'utf8'));
    payload = this.base64RawURLEncode(Buffer.from(JSON.stringify(payload), 'utf8'));

    let result = [header, payload]
    let sign = this.base64RawURLEncode(forge.pki.ed25519.sign({
      message: result.join('.'),
      encoding: 'utf8',
      privateKey
    }))
    result.push(sign)
    return result.join('.')
  }
}

module.exports = Mixin;


