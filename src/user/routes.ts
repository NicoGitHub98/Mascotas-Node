"use strict";

import * as express from "express";
import { profile } from "winston";
import * as error from "../server/error";
import { onlyLoggedIn } from "../token/passport";
import * as token from "../token/service";
import * as user from "./service";
import { ISessionRequest } from "./service";
import * as profileService from "../profile/service"

/**
 * Modulo de seguridad, login/logout, cambio de contraseñas, etc
 */
export function initModule(app: express.Express) {
  app.route("/v1/user/password").post(onlyLoggedIn, changePassword);

  app.route("/v1/user").post(signUp);
  app.route("/v1/user/signin").post(login);
  app.route("/v1/user/signout").get(onlyLoggedIn, logout);
  app.route("/v1/users/:userID/grant").post(onlyLoggedIn, grantPermissions);
  app.route("/v1/users/:userID/revoke").post(onlyLoggedIn, revokePermissions);
  app.route("/v1/users/:userID/enable").post(onlyLoggedIn, enableUser);
  app.route("/v1/users/:userID/disable").post(onlyLoggedIn, disableUser);
  app.route("/v1/users").get(onlyLoggedIn, getAll);
  app.route("/v1/users/current").get(onlyLoggedIn, current);
  
  app.route("/v1/users/:userID/follow").post(onlyLoggedIn, followUser);
  app.route("/v1/users/:userID/unfollow").post(onlyLoggedIn, unfollowUser);
}

/**
 * @api {post} /v1/user/password Cambiar Password
 * @apiName Cambiar Password
 * @apiGroup Seguridad
 *
 * @apiDescription Cambia la contraseña del usuario actual.
 *
 * @apiExample {json} Body
 *    {
 *      "currentPassword" : "{Contraseña actual}",
 *      "newPassword" : "{Nueva Contraseña}",
 *    }
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function changePassword(req: ISessionRequest, res: express.Response) {
  await user.changePassword(req.user.user_id, req.body);
  res.send();
}

/**
 * @apiDefine TokenResponse
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "{Token de autorización}"
 *     }
 */
/**
 * @api {post} /v1/users Registrar Usuario
 * @apiName Registrar Usuario
 * @apiGroup Seguridad
 *
 * @apiDescription Registra un nuevo usuario en el sistema.
 *
 * @apiExample {json} Body
 *    {
 *      "name": "{Nombre de Usuario}",
 *      "login": "{Login de usuario}",
 *      "password": "{Contraseña}"
 *    }
 *
 * @apiUse TokenResponse
 *
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function signUp(req: express.Request, res: express.Response) {
  const userId = await user.register(req.body);
  const tokenString = await token.create(userId);
  res.json({ token: tokenString });
}

/**
 * @api {post} /v1/users/signin Login
 * @apiName Log in
 * @apiGroup Seguridad
 *
 * @apiDescription Loguea un usuario en el sistema.
 *
 * @apiExample {json} Body
 *    {
 *      "login": "{Login de usuario}",
 *      "password": "{Contraseña}"
 *    }
 *
 * @apiUse TokenResponse
 *
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function login(req: express.Request, res: express.Response) {
  const userId = await user.login(req.body);
  const tokenString = await token.create(userId);
  res.json({ token: tokenString });
}

/**
 * @api {get} /v1/users/signout Logout
 * @apiName Logout
 * @apiGroup Seguridad
 *
 * @apiDescription Desloguea un usuario en el sistema, invalida el token.
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 */
async function logout(req: ISessionRequest, res: express.Response) {
  await token.invalidate(req.user);
  res.send();
}


/**
 * @api {post} /v1/users/:userId/grant Otorga Permisos
 * @apiName Otorga Permisos
 * @apiGroup Seguridad
 *
 * @apiDescription Otorga permisos al usuario indicado, el usuario logueado tiene que tener permiso "admin".
 *
 * @apiExample {json} Body
 *    {
 *      "permissions" : ["{permiso}", ...],
 *    }
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function grantPermissions(req: ISessionRequest, res: express.Response) {
  await user.hasPermission(req.user.user_id, "admin");
  await user.grant(req.params.userID, req.body.permissions);
  res.send();
}

/**
 * @api {post} /v1/users/:userId/revoke Revoca Permisos
 * @apiName Revoca Permisos
 * @apiGroup Seguridad
 *
 * @apiDescription Quita permisos al usuario indicado, el usuario logueado tiene que tener permiso "admin".
 *
 * @apiExample {json} Body
 *    {
 *      "permissions" : ["{permiso}", ...],
 *    }
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function revokePermissions(req: ISessionRequest, res: express.Response) {
  await user.hasPermission(req.user.user_id, "admin");
  await user.revoke(req.params.userID, req.body.permissions);
  res.send();
}


/**
 * @api {post} /v1/users/:userId/enable Habilitar Usuario
 * @apiName Habilitar Usuario
 * @apiGroup Seguridad
 *
 * @apiDescription Habilita un usuario en el sistema. El usuario logueado debe tener permisos "admin".
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function enableUser(req: ISessionRequest, res: express.Response) {
  await user.hasPermission(req.user.user_id, "admin");
  await user.enable(req.params.userID);
  res.send();
}

/**
 * @api {post} /v1/users/:userId/disable Deshabilitar Usuario
 * @apiName Deshabilitar Usuario
 * @apiGroup Seguridad
 *
 * @apiDescription Deshabilita un usuario en el sistema.   El usuario logueado debe tener permisos "admin".
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function disableUser(req: ISessionRequest, res: express.Response) {
  await user.hasPermission(req.user.user_id, "admin");
  await user.disable(req.params.userID);
  res.send();
}

/**
 * @api {post} /v1/users Lista de Usuarios
 * @apiName Lista de Usuarios
 * @apiGroup Seguridad
 *
 * @apiDescription Devuelve una lista de usuarios. El usuario logueado debe tener permisos "admin".
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *     [{
 *        "id": "{Id usuario}",
 *        "name": "{Nombre del usuario}",
 *        "login": "{Login de usuario}",
 *        "permissions": [
 *            "{Permission}"
 *        ],
 *        "enabled": true|false
 *       }, ...
 *     ]
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function getAll(req: ISessionRequest, res: express.Response) {
  await user.hasPermission(req.user.user_id, "admin");
  const users = await user.findAll();

  res.json(users.map(u => {
    return {
      id: u.id,
      name: u.name,
      login: u.login,
      permissions: u.permissions,
      enabled: u.enabled
    };
  }));
}


/**
 * @api {get} /v1/users/current Usuario Actual
 * @apiName Usuario Actual
 * @apiGroup Seguridad
 *
 * @apiDescription Obtiene información del usuario actual.
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *     {
 *        "id": "{Id usuario}",
 *        "name": "{Nombre del usuario}",
 *        "login": "{Login de usuario}",
 *        "permissions": [
 *            "{Permission}"
 *        ],
 *        "following": "{Users Seguidos}",
 *        "profile": "{Perfil de Usuario}"
 *     }
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 */
async function current(req: ISessionRequest, res: express.Response) {
  const response = await user.findById(req.user.user_id);
  const profileId = (await profileService.read(req.user.user_id))._id
  return res.json({
    id: response.id,
    name: response.name,
    login: response.login,
    permissions: response.permissions,
    following: response.following,
    profile: profileId
  });
}

/**
 * @api {post} /v1/users/:userId/follow Seguir Usuario
 * @apiName Seguir Usuario
 * @apiGroup Amigos
 *
 * @apiDescription Sigue a un usuario del sistema.
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *  {
      id: {id de usuario seguido},
      name: {nombre de usuario seguido},
    }
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function followUser(req: ISessionRequest, res: express.Response){
  try {
  const response = await user.follow(req.user.user_id, req.params.userID);
    return res.json({
      id: response.id,
      name: response.name,
    });
  }
  catch(err){
    return res.status(400).json({
      failAt: err.failAt,
      message: err.message
    })
  }
}

/**
 * @api {post} /v1/users/:userId/unfollow Dejar de Seguir Usuario
 * @apiName Dejar de Seguir Usuario
 * @apiGroup Amigos
 *
 * @apiDescription Deja de seguir a un usuario del sistema.
 *
 * @apiSuccessExample {json} Respuesta
 *     HTTP/1.1 200 OK
 *  {
      id: {id de usuario no seguido},
      name: {nombre de usuario no seguido},
    }
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
 * @apiUse OtherErrors
 */
async function unfollowUser(req: ISessionRequest, res: express.Response){
  try {
    const response = await user.unfollow(req.user.user_id, req.params.userID);
    return res.json({
      id: response.id,
      name: response.name,
    });
  }
  catch(err){
    return res.status(400).json({
      failAt: err.failAt,
      message: err.message
    })
  }
}

