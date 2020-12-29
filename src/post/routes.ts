"use strict";

import * as express from "express";
import * as error from "../server/error";
import { onlyLoggedIn } from "../token/passport";
import { ISessionRequest } from "../user/service";
import * as postService from "./service";

export function initModule(app: express.Express) {
  app.route("/v1/allPosts").get(onlyLoggedIn, getAllPosts)
  app.route("/v1/myPosts").get(onlyLoggedIn, myPosts)
  app.route("/v1/publish").post(onlyLoggedIn, publish)
  app.route("/v1/:postId/update").put(onlyLoggedIn, updatePost)
  app.route("/v1/:postId/delete").delete(onlyLoggedIn, deletePost)
  app.route("/v1/myFeed").get(onlyLoggedIn, getMyFeed)
  app.route("/v1/:postId/like").post(onlyLoggedIn, likePost)
  app.route("/v1/:postId/dislike").post(onlyLoggedIn, dislikePost)
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Posts
 *  [
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": [Id usuario],
 *      "pets": [Id de macota etiquetada],
 *      "user": "Id del user autor",
 *      "updated": "Fecha Actualizacion";
 *      "created": "Fecha creacion";
 *      "enabled": "Baja Logica";
 *    }
 *  ]
 */
/**
 * @api {get} /v1/myPosts Obtener Todos los Posteos de la Red
 * @apiName Obtener Todos los Posts
 * @apiGroup Publicaciones
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function getAllPosts(req: ISessionRequest, res: express.Response) {
  const result = await postService.findAll();
  res.json({
    posts: result
  });
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Posts
 *  [
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": [Id usuario],
 *      "pets": [Id de macota etiquetada],
 *      "user": "Id del user autor",
 *      "updated": "Fecha Actualizacion";
 *      "created": "Fecha creacion";
 *      "enabled": "Baja Logica";
 *    }
 *  ]
 */
/**
 * @api {get} /v1/myPosts Obtener Mis Posteos
 * @apiName Obtener Mis Posts
 * @apiGroup Publicaciones
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function myPosts(req: ISessionRequest, res: express.Response) {
    const result = await postService.findAllByUserId(req.user.user_id);
    res.json({
      posts: result
    });
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Posts
 *  [
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": [Id usuario],
 *      "pets": [Id de macota etiquetada],
 *      "user": "Id del user autor",
 *      "updated": "Fecha Actualizacion";
 *      "created": "Fecha creacion";
 *      "enabled": "Baja Logica";
 *    }
 *  ]
 */
/**
 * @api {get} /v1/myFeed Obtener Los Posteos de mis seguidos
 * @apiName Obtener Mis Posts de mi Feed
 * @apiGroup Publicaciones
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function getMyFeed(req: ISessionRequest, res: express.Response) {
    const result = await postService.findMyFeedPosts(req.user.user_id);
    res.json({
      posts: result
    });
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Post
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": [Id usuario],
 *      "pets": [Id de macota etiquetada],
 *      "user": "Id del user autor",
 *      "updated": "Fecha Actualizacion";
 *      "created": "Fecha creacion";
 *      "enabled": "Baja Logica";
 *    }
 */
/**
 * @api {post} /v1/publish Publicar un post
 * @apiName Publicar post
 * @apiGroup Publicaciones
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function publish(req: ISessionRequest, res: express.Response) {
    const body = {user_id: req.user.user_id, ...req.body}
    const result = await postService.publish(body);
    res.json({
        title: result.title,
        description: result.description,
        picture: result.picture,
        likes: result.likes,
        pets: result.pets,
        user: result.user,
        updated: result.updated,
        created: result.created,
        enabled: result.enabled,
    });
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Post
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": [Id usuario],
 *      "pets": [Id de macota etiquetada],
 *      "user": "Id del user autor",
 *      "updated": "Fecha Actualizacion";
 *      "enabled": "Baja Logica";
 *    }
 */
/**
 * @api {post} /v1/:postId/update Actualizar un post
 * @apiName Actualizar post
 * @apiGroup Publicaciones
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function updatePost(req: ISessionRequest, res: express.Response) {
  const body = {user_id: req.user.user_id, ...req.body}
  const result = await postService.updatePost(body, req.params.postId);
  res.json({
      title: result.title,
      description: result.description,
      picture: result.picture,
      likes: result.likes,
      pets: result.pets,
      user: result.user,
      updated: result.updated,
      created: result.created,
      enabled: result.enabled,
  });
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Post
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": [Id usuario],
 *      "pets": [Id de macota etiquetada],
 *      "user": "Id del user autor",
 *      "updated": "Fecha Actualizacion";
 *      "enabled": "Baja Logica";
 *    }
 */
/**
 * @api {post} /v1/:postId/delete Eliminar un post
 * @apiName Eliminar post
 * @apiGroup Publicaciones
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function deletePost(req: ISessionRequest, res: express.Response) {
  const result = await postService.deletePost(req.user.user_id, req.params.postId);
  res.json({
      title: result.title,
      description: result.description,
      picture: result.picture,
      likes: result.likes,
      pets: result.pets,
      user: result.user,
      updated: result.updated,
      created: result.created,
      enabled: result.enabled,
  });
}

async function likePost(req: ISessionRequest, res: express.Response) {
  const result = await postService.like(req.user.user_id, req.params.postId);
  res.json({
      title: result.title,
      description: result.description,
      picture: result.picture,
      likes: result.likes,
      pets: result.pets,
      user: result.user,
      updated: result.updated,
      created: result.created,
      enabled: result.enabled,
  });
}

async function dislikePost(req: ISessionRequest, res: express.Response) {
  const result = await postService.dislike(req.user.user_id, req.params.postId);
  res.json({
      title: result.title,
      description: result.description,
      picture: result.picture,
      likes: result.likes,
      pets: result.pets,
      user: result.user,
      updated: result.updated,
      created: result.created,
      enabled: result.enabled,
  });
}