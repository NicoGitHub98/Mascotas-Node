"use strict";

import { IProfile, Profile } from "./schema";
const mongoose = require("mongoose");
import * as error from "../server/error";
import * as provinces from "../provinces/service";
import { IUser, User } from "../user/user";
import * as imageService from "../image/service"

export async function findForUser(userId: string): Promise<IProfile> {
  return await Profile.findOne({
    user: mongoose.Types.ObjectId(escape(userId)),
    enabled: true
  });
}

export async function read(userId: string): Promise<IProfile> {
  try {
    const profile = await findForUser(userId);
    if (!profile) {
      return Promise.resolve(new Profile());
    }
    return Promise.resolve(profile);
  } catch (err) {
    return Promise.reject(err);
  }
}


interface IUpdateProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  province: string;
}
async function validateProfile(body: IUpdateProfile, isNew: boolean): Promise<IUpdateProfile> {
  const result: error.ValidationErrorMessage = {
    messages: []
  };

  if (isNew && (!body.email || body.email.length <= 0)) {
    result.messages.push({ path: "email", message: "No puede quedar vacío." });
  }
  if (body.email && body.email.length > 256) {
    result.messages.push({ path: "email", message: "Hasta 256 caracteres solamente." });
  }
  if (isNew && (!body.name || body.name.length <= 0)) {
    result.messages.push({ path: "name", message: "No puede quedar vacío." });
  }
  if (body.name && body.name.length > 1024) {
    result.messages.push({ path: "name", message: "Hasta 1024 caracteres solamente." });
  }
  if (body.address && body.address.length > 1024) {
    result.messages.push({ path: "address", message: "Hasta 1024 caracteres solamente." });
  }
  if (body.phone && body.phone.length > 32) {
    result.messages.push({ path: "phone", message: "Hasta 32 caracteres solamente." });
  }

  if (body.province) {
    const province = await provinces.read(body.province);
    if (!province) {
      result.messages.push({ path: "province", message: "No se encuentra." });
    }
  }

  if (result.messages.length > 0) {
    return Promise.reject(result);
  }

  return Promise.resolve(body);
}
export async function updateBasicInfo(userId: string, body: IUpdateProfile): Promise<IProfile> {
  try {
    let profile = await findForUser(userId);
    const validatedBody = await validateProfile(body, !!profile);
    if (!profile) {
      profile = new Profile();
      profile.id = mongoose.Types.ObjectId.createFromHexString(userId);
      profile.user = mongoose.Types.ObjectId.createFromHexString(userId);
    }

    if (validatedBody.email) {
      profile.email = validatedBody.email;
    }

    if (validatedBody.name) {
      profile.name = validatedBody.name;
    }
    if (validatedBody.address) {
      profile.address = validatedBody.address;
    }
    if (validatedBody.phone) {
      profile.phone = validatedBody.phone;
    }
    if (validatedBody.province) {
      profile.province = (await provinces.read(body.province))._id;
    } else {
      profile.province = undefined;
    }

    await profile.save();
    return Promise.resolve(profile);
  } catch (err) {
    return Promise.reject(err);
  }
}


async function validateUpdateProfilePicture(imageId: string): Promise<void> {
  const result: error.ValidationErrorMessage = {
    messages: []
  };

  if (!imageId || imageId.length <= 0) {
    result.messages.push({ path: "image", message: "Imagen inválida." });
  }

  if (result.messages.length > 0) {
    return Promise.reject(result);
  }

  return Promise.resolve();
}
export async function updateProfilePicture(userId: string, imageId: string): Promise<IProfile> {
  try {
    let profile = await findForUser(userId);
    await validateUpdateProfilePicture(imageId);

    if (!profile) {
      profile = new Profile();
      profile.id = mongoose.Types.ObjectId.createFromHexString(userId);
      profile.user = mongoose.Types.ObjectId.createFromHexString(userId);
    }
    profile.picture = imageId;

    await profile.save();
    return Promise.resolve(profile);
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function findProfileByQueryName(searchParameter: string, userId: string): Promise<IProfile[]> {
  try {
      let users = await User.find({ name: new RegExp('^.*('+searchParameter+').*$', "i"), enabled: true }).exec();
      if (!users) {
          throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
      }

      let usersIds = users.map(user=>user._id)

      let profiles = await Profile.find({ 
        $or: [
          {name: new RegExp('^.*('+searchParameter+').*$', "i"), enabled: true},
          {user: {$in: usersIds}}
        ],
        //No tengo en cuenta user actual, para que cuando busque no se encuentre a si mismo
        user: {$ne: mongoose.Types.ObjectId(userId)}
      })/*.populate("user")*/.exec();
      if (!users || !profiles) {
          throw error.newError(error.ERROR_NOT_FOUND, "El usuario/perfil no se encuentra");
      }
      
      for (const perfil of profiles) {
        if(perfil.picture){
          perfil.picture = (await imageService.findByID(perfil.picture)).image
        } else {
          perfil.picture = "/assets/default_profile_image.jpg";
        }
      }
      
      return Promise.resolve(profiles);
  } catch (err) {
      return Promise.reject(err);
  }
}

export async function findProfileById(profileId: string): Promise<IProfile> {
  try {
    let profile = await Profile.findOne({ _id: profileId, enabled: true}).exec();
    if (!profile) {
      throw error.newError(error.ERROR_NOT_FOUND, "El perfil no se encuentra");
  }
    return Promise.resolve(profile)
  } catch (error) {
    return Promise.reject(error)
  }
}

export async function findForUsers(usersId: any[]): Promise<IProfile[]> {
  const profiles = await Profile.find({
    user: {$in: usersId},
    enabled: true
  });
  for (const profile of profiles) {
    if(profile.picture) profile.picture = (await imageService.findByID(profile.picture)).image
  }
  return profiles
}
