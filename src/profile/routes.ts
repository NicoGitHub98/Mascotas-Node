"use strict";

import * as express from "express";
import * as error from "../server/error";
import { onlyLoggedIn } from "../token/passport";
import { ISessionRequest } from "../user/service";
import * as profileService from "./service";
import * as postService from "../post/service";

/**
 * Modulo de perfiles de usuario
 */
export function initModule(app: express.Express) {
  app.route("/v1/profile").get(onlyLoggedIn, current)
                          .post(onlyLoggedIn, updateBasicInfo);
  app.route("/v1/profile/find").get(onlyLoggedIn, findProfileByName)
    
  app.route("/v1/profile/:userId").get(onlyLoggedIn, seeProfile)

}

/**
 * @apiDefine IProfileResponse
 *
 * @apiSuccessExample {json} Perfil
 *    {
 *      "name": "Nombre y Apellido",
 *      "phone": "Teléfono",
 *      "email": "Email",
 *      "address": "Dirección",
 *      "picture": "Id de imagen",
 *      "province": "Id de provincia",
 *    }
 */

/**
 * @api {get} /v1/profile Obtener Perfil
 * @apiName Obtener Perfil
 * @apiGroup Perfil
 *
 * @apiUse IProfileResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 */
async function current(req: ISessionRequest, res: express.Response) {
  const result = await profileService.read(req.user.user_id);
  res.json({
    name: result.name,
    phone: result.phone,
    email: result.email,
    address: result.address,
    province: result.province,
    picture: result.picture
  });
}

/**
 * @apiDefine IProfileResponse
 *
 * @apiSuccessExample {json} Perfil
 *    {
 *      "name": "Nombre y Apellido",
 *      "phone": "Teléfono",
 *      "email": "Email",
 *      "address": "Dirección",
 *      "picture": "Id de imagen",
 *      "province": "Id de provincia",
 *    }
 */

/**
 * @api {post} /v1/profile Actualizar Perfil
 * @apiName Actualizar Perfil
 * @apiGroup Perfil
 *
 * @apiDescription Actualiza los datos del perfil de usuario.
 *
 * @apiExample {json} Perfil
 *    {
 *      "name": "Nombre y Apellido",
 *      "phone": "Teléfono",
 *      "email": "Email",
 *      "address": "Dirección",
 *      "province": "Id de provincia",
 *    }
 *
 * @apiUse IProfileResponse
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function updateBasicInfo(req: ISessionRequest, res: express.Response) {
  const result = await profileService.updateBasicInfo(req.user.user_id, req.body);
  res.json({
    name: result.name,
    phone: result.phone,
    email: result.email,
    address: result.address,
    province: result.province,
  });
}

async function seeProfile(req: ISessionRequest, res: express.Response) {
  const profile = await profileService.read(req.params.userId);
  const posts = await postService.findAllByUserId(req.params.userId);
  res.json({
    name: profile.name,
    phone: profile.phone,
    province: profile.province,
    picture: profile.picture,
    posts: posts
  });
}

async function findProfileByName(req: ISessionRequest, res: express.Response) {
  const profiles = await profileService.findProfileByQueryName(req.query.name.toString());
  res.json(profiles);
}