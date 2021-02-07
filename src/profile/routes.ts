"use strict";

import * as express from "express";
import * as error from "../server/error";
import { onlyLoggedIn } from "../token/passport";
import { ISessionRequest } from "../user/service";
import * as profileService from "./service";
import * as postService from "../post/service";
import * as imageService from "../image/service"

/**
 * Modulo de perfiles de usuario
 */
export function initModule(app: express.Express) {
  app.route("/v1/profile").get(onlyLoggedIn, current)
                          .post(onlyLoggedIn, updateBasicInfo);
  app.route("/v1/profile/find").get(onlyLoggedIn, findProfileByName)
    
  app.route("/v1/profile/:profileId").get(onlyLoggedIn, seeProfile)

  app.route("/v1/profiles/:userId").get(onlyLoggedIn, getProfileByUserId)

  app.route("/v1/profiles/following").post(onlyLoggedIn, getProfilesByFollowing)

}

/**
 * @apiDefine IProfileResponse
 *
 * @apiSuccessExample {json} Perfil Respuesta
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
 * @api {get} /v1/profile Obtener mi Perfil
 * @apiName Perfil Actual
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
 * @api {post} /v1/profile Actualizar Perfil
 * @apiName Actualizar Perfil
 * @apiGroup Perfil
 *
 * @apiDescription Actualiza los datos del perfil de usuario.
 *
 * @apiExample {json} Perfil Ejemplo
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

/**
 * @api {get} /v1/profile/:profileId Obtener Perfil
 * @apiName Obtener Perfil
 * @apiGroup Perfil
 *
 * @apiDescription Actualiza los datos del perfil de usuario.
 * @apiParam {String} id ID del perfil
 * 
 * @apiExample {json} Perfil Ejemplo
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
 * @apiUse OtherErrors
 */

async function seeProfile(req: ISessionRequest, res: express.Response) {
  const profile = await profileService.findProfileById(req.params.profileId);
  const posts = await postService.findAllByUserId(profile.user.toString());
  if(profile.picture)  profile.picture = (await imageService.findByID(profile.picture)).image
  res.json({
    name: profile.name,
    phone: profile.phone,
    address: profile.address,
    province: profile.province,
    picture: profile.picture,
    posts: posts,
    user: profile.user
  });
}

/**
 * @api {get} /v1/profile/find?name= Buscar Perfiles
 * @apiName Buscar Perfiles
 * @apiGroup Perfil
 *
 * @apiDescription Busca Perfiles cuyo nombre, apellido o usuario concuerden con los del parametro de busqueda.
 * @apiParam {String} name nombre, apellido o usuario del perfil
 * 
 * @apiExample {json} Perfiles Ejemplo
 * [
 *    {
 *      "name": "Nombre y Apellido",
 *      "phone": "Teléfono",
 *      "email": "Email",
 *      "address": "Dirección",
 *      "province": "Id de provincia",
 *    }
 * ]
 *
 * @apiUse IProfileResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 */

async function findProfileByName(req: ISessionRequest, res: express.Response) {
  const profiles = await profileService.findProfileByQueryName(req.query.name.toString(), req.user.user_id);
  res.json(profiles);
}

/**
 * @api {get} /v1/profiles/:userId Obtener Perfil por id de usuario
 * @apiName Obtener Perfil por UserID
 * @apiGroup Perfil
 *
 * @apiDescription Obtiene perfil cuyo usuario concuerde con el id provisto
 * @apiParam {String} id ID de Usuario
 * 
 * @apiExample {json} Perfil Ejemplo
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
 * @apiUse OtherErrors
 */
async function getProfileByUserId(req: ISessionRequest, res: express.Response) {
  const profile = await profileService.findForUser(req.params.userId);
  res.json(profile);
}

/**
 * @api {get} /v1/profiles/:userId Obtener Perfiles de seguidos
 * @apiName Obtener Perfiles por UserID de seguidos
 * @apiGroup Perfil
 *
 * @apiDescription Obtiene perfiles cuyo usuarios estan siendo seguidos
 * @apiParam {String[]} id IDs de Usuario
 * 
 * @apiExample {json} Perfil Ejemplo
 *    [
 *      {
 *      name: 'Nombre de Perfil',
 *      phone: 'Telefono',
 *      email: 'Email',
 *      address: 'Direccion',
 *      picture: 'Imagen',
 *      _id: "ID del perfil",
 *      user: "ID del usuario",
 *      }
 *    ]
 *
 * @apiUse IProfileResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 */
async function getProfilesByFollowing(req: ISessionRequest, res: express.Response) {
  const profiles = await profileService.findForUsers(req.body.users);
  res.json(profiles);
}