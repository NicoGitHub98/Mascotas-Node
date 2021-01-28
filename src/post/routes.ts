"use strict";

import * as express from "express";
import * as error from "../server/error";
import { onlyLoggedIn } from "../token/passport";
import { ISessionRequest } from "../user/service";
import * as postService from "./service";
import * as imageService from "../image/service";

export function initModule(app: express.Express) {
  app.route("/v1/allPosts").get(onlyLoggedIn, getAllPosts)
  app.route("/v1/myPosts").get(onlyLoggedIn, myPosts)
  app.route("/v1/:userId/posts").get(onlyLoggedIn, getPostsOfUser)
  app.route("/v1/posts/publish").post(onlyLoggedIn, publish)
  app.route("/v1/posts/:postId").get(onlyLoggedIn, getById)
  app.route("/v1/posts/:postId/update").put(onlyLoggedIn, updatePost)
  app.route("/v1/posts/:postId/delete").delete(onlyLoggedIn, deletePost)
  app.route("/v1/myFeed").get(onlyLoggedIn, getMyFeed)
  app.route("/v1/explore").get(onlyLoggedIn,getPopularPosts)
  app.route("/v1/posts/:postId/like").post(onlyLoggedIn, likePost)
  app.route("/v1/posts/:postId/dislike").post(onlyLoggedIn, dislikePost)
}

/**
 * @apiDefine IPostsResponse
 *
 * @apiSuccessExample {json} Posts Respuesta
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
 * @api {get} /v1/allPosts Obtener Todos los Posteos de la Red
 * @apiName Obtener Todos los Posts
 * @apiGroup Publicaciones
 *
 * @apiUse IPostsResponse
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
 * @api {get} /v1/myFeed Obtener Los Posteos de mis seguidos
 * @apiName Obtener Posts de mi Feed
 * @apiGroup Publicaciones
 *
 * @apiUse IPostsResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function getMyFeed(req: ISessionRequest, res: express.Response) {
    const result = await postService.findMyFeedPosts(req.user.user_id);
    for (const post of result) {
      if(post.picture) post.picture = (await imageService.findByID(post.picture)).image
    }
    res.json(result);
}

/**
 * @apiDefine IPostResponse
 *
 * @apiSuccessExample {json} Post
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del post",
 *      "picture": "Imagen del post",
 *      "likes": ["Id usuario"],
 *      "pets": ["Id de macota etiquetada"],
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
 * @apiExample {json} Post
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del Post",
 *      "picture": "Imagen del post (base64)",
 *      "pets": [Id mascota Etiquetada],
 *      "user": "Id del usuario que postea"
 *    }
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
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
 * @api {get} /v1/posts/:postId Obtener Post
 * @apiName Obtener Posts
 * @apiGroup Publicaciones
 * 
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function getById(req: ISessionRequest, res: express.Response) {
  const result = await postService.findById(req.params.postId);
  const imagen = (await imageService.findByID(result.picture)).image
  res.json({
    id: result._id,
    title: result.title,
    description: result.description,
    picture: imagen,
    likes: result.likes,
    pets: result.pets,
    user: result.user,
    updated: result.updated,
    created: result.created,
    enabled: result.enabled,
});
}

/**
 * @api {post} /v1/:postId/update Actualizar un post
 * @apiName Actualizar post
 * @apiGroup Publicaciones
 * 
 * @apiExample {json} Post
 *    {
 *      "title": "Titulo del Post",
 *      "description": "Descripcion del Post",
 *      "picture": "Imagen del post (base64)",
 *      "pets": ["Id mascota Etiquetada"],
 *      "user": "Id del usuario que postea"
 *    }
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse ParamValidationErrors
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
 * @api {delete} /v1/:postId/delete Eliminar un post
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

/**
 * @api {post} /v1/posts/:postId/like Dar like a un post
 * @apiName Like Post
 * @apiGroup Publicaciones
 * @apiParam postId {string} ID del Post
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
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

/**
 * @api {post} /v1/posts/:postId/dislike Quitar like a un post
 * @apiName Dislike Post
 * @apiGroup Publicaciones
 * @apiParam postId {string} ID del Post
 *
 * @apiUse IPostResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
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

/**
 * @api {get} /v1/:userId/posts Obtener Todos los Posteos de un usuario
 * @apiName Obtener Posts de Usuario
 * @apiGroup Publicaciones
 * @apiParam userId {string} ID del Usuario
 *
 * @apiUse IPostsResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function getPostsOfUser(req: ISessionRequest, res: express.Response) {
  const result = await postService.findAllByUserId(req.params.userId);
  for (const post of result) {
    if(post.picture){
      post.picture = (await imageService.findByID(post.picture)).image
    } 
  }
  res.json(result);
}

/**
 * @api {get} /v1/explore?likes= Obtener Todos los Posteos populares
 * @apiName Obtener Posts Populares
 * @apiDescription Obtiene los posts populares (Con mas de {likes} likes)
 * @apiParam likes {number} Numero de likes para filtrar posts
 * @apiGroup Publicaciones
 *
 * @apiUse IPostsResponse
 *
 * @apiUse AuthHeader
 * @apiUse OtherErrors
 * 
 */
async function getPopularPosts(req: ISessionRequest, res: express.Response) {
  const result = await postService.findPostByLikeAmount(Math.abs(parseInt(req.query.likes.toString())));
  for (const post of result) {
    if(post.picture){
      post.picture = (await imageService.findByID(post.picture)).image
    } 
  }
  res.json(result);
}