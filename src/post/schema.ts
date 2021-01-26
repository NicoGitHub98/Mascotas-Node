"use strict";

import * as mongoose from "mongoose";

export interface IPost extends mongoose.Document {
  title: string;
  description: string;
  picture: string;
  likes: mongoose.Schema.Types.ObjectId[];
  pets: mongoose.Schema.Types.ObjectId[];
  user: mongoose.Schema.Types.ObjectId;
  updated: Number;
  created: Number;
  enabled: Boolean;
  likesQuantity: Number,
  like: Function;
  unlike: Function;
}
/**
 * Esquema del Perfil
 */
export let PostSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "",
    trim: true,
    required: "El titulo de la publicacion es requerido"
  },
  description: {
    type: String,
    ref: "Image"
  },
  picture: {
    type: String,
    default: "",
    trim: true
  },
  likes: {
    type: [
        {
          type: mongoose.Schema.Types.ObjectId,
        }
      ],
      default: []
  },
  likesQuantity: {
    type: Number,
    default: 0
  },
  pets: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet",
      }
    ],
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: "Usuario es requerido"
  },
  updated: {
    type: Date,
    default: Date.now()
  },
  created: {
    type: Date,
    default: Date.now()
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, { collection: "posts" });


PostSchema.methods.like = function (user_id: mongoose.Schema.Types.ObjectId) {
  this.likes.push(user_id);
  this.likesQuantity+=1;

  this.updated = Date.now();
};

PostSchema.methods.unlike = function (user_id: mongoose.Schema.Types.ObjectId) {
  var index = this.likes.indexOf(user_id);
  if (index > -1) {
    this.likes.splice(index, 1);
    this.likesQuantity-=1;
  }

  this.updated = Date.now();
};

/**
 * Antes de guardar
 */
PostSchema.pre("save", function (this: IPost, next) {
  this.updated = Date.now();
  next();
});

export let Post = mongoose.model<IPost>("Post", PostSchema);