"use strict";

const mongoose = require("mongoose");
import * as express from "express";
import { Payload } from "../token/passport";
import * as env from "../server/environment";
import * as error from "../server/error";
import { IPost, Post } from "./schema";
import * as userService from "../user/service"
import { userInfo } from "os";
import * as imageService from "../image/service";

const conf = env.getConfig(process.env);

export interface newPost {
    user_id: string,
    title: string,
    description: string,
    picture: string,
    pets: string[],
}

export interface Post{
    
}

export function findAll(): Promise<IPost[]> {
    return new Promise<IPost[]>((resolve, reject) => {
        Post.find({},
            function (err: any, post: IPost[]) {
                if (err) return reject(err);
                resolve(post);
            });
    });
}

export async function findById(postId: string): Promise<IPost> {
    try {
        const post = await Post.findOne({ _id: postId }).exec();
        if (!post) {
            throw error.ERROR_NOT_FOUND;
        }

        return Promise.resolve(post);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function findAllByUserId(userId: string): Promise<IPost[]> {
    try {
        const posts = await Post.find({ user: mongoose.Types.ObjectId.createFromHexString(userId)}).exec();
        if (!posts) {
            console.log("No hay posts")
        }
        return Promise.resolve(posts);
    } catch (err) {
        console.log("Error en findAllByUserId:",err)
        return Promise.reject(err);
    }
}

export async function findMyFeedPosts(userId: string): Promise<IPost[]> {
    try {
        const following = await userService.getFollowing(userId);
        const posts = await Post.find({ user: { $in: following}}).exec();
        if (!posts) {
            throw error.ERROR_NOT_FOUND;
        }

        return Promise.resolve(posts);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function findPostByLikeAmount(likes: number): Promise<IPost[]> {
    try {
        const posts = await Post.find({ "likesQuantity": {"$gt": likes} }).exec();
        console.log("Los posts populares son: ",posts)
        if (!posts) {
            throw error.ERROR_NOT_FOUND;
        }

        return Promise.resolve(posts);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function publish(body: newPost): Promise<IPost> {
    try {
        if(body.picture){
            body.picture = (await imageService.create({image: body.picture})).id
        }

        const post = <IPost>new Post();
        post.title = body.title;
        post.description = body.description;
        post.picture = body.picture;
        post.pets = body.pets.map(petId=> mongoose.Types.ObjectId.createFromHexString(petId));
        post.user = mongoose.Types.ObjectId.createFromHexString(body.user_id);

        await post.save();
        return Promise.resolve(post);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function updatePost(body: newPost, postId: string): Promise<IPost> {
    try {
        const post = await Post.findOne({ 
            _id: postId, 
            user: mongoose.Types.ObjectId.createFromHexString(body.user_id)
        }).exec();

        if(body.picture){
            body.picture = (await imageService.create({image: body.picture})).id
            post.picture = body.picture;
        }
        
        if(body.title){
            post.title = body.title;
        }

        if(body.description){
            post.description = body.description;
        }
        if(body.pets){
            post.pets = body.pets.map(petId=> mongoose.Types.ObjectId.createFromHexString(petId));
        }
        await post.save();
        return Promise.resolve(post);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function deletePost(userId: string, postId: string): Promise<any> {
    try {
        const post = await Post.deleteOne({ 
            _id: postId,
            user: mongoose.Types.ObjectId.createFromHexString(userId),
        }).exec();
        //post.enabled = false;
        //await post.save();
        return Promise.resolve(post);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function like(userId: string, postId: string): Promise<IPost> {
    try {
        const userIdAsMongooseId =  mongoose.Types.ObjectId(userId)

        const post = await Post.findOne({ _id: postId }).exec();
        
        var index = post.likes.indexOf(mongoose.Types.ObjectId(userIdAsMongooseId));
        if (index > -1) {
            //Si le gustaba, le deja de gustar
            post.unlike(userIdAsMongooseId);
        } else {
            post.like(userIdAsMongooseId);
        }
        await post.save();
        return Promise.resolve(post);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function dislike(userId: string, postId: string): Promise<IPost> {
    try {
        const userIdAsMongooseId =  mongoose.Types.ObjectId(userId)

        const post = await Post.findOne({ _id: postId }).exec();
        
        var index = post.likes.indexOf(mongoose.Types.ObjectId(userIdAsMongooseId));
        if (index > -1) {
            //Si le gustaba, le deja de gustar
            post.unlike(userIdAsMongooseId);
        } else {
            post.like(userIdAsMongooseId);
        }
        await post.save();
        return Promise.resolve(post);
    } catch (err) {
        return Promise.reject(err);
    }
}