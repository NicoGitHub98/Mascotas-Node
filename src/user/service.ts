"use strict";

import * as express from "express";
import { Payload } from "../token/passport";
import * as env from "../server/environment";
import * as error from "../server/error";
import { IUser, User } from "./user";
import * as mongoose  from "mongoose";
import { Profile } from "../profile/schema";

const conf = env.getConfig(process.env);

export interface ISessionRequest extends express.Request {
    user: Payload;
}

export interface SignUpRequest {
    name?: string;
    password?: string;
    login?: string;
}

export async function register(signUpRequest: SignUpRequest): Promise<string> {
    try {
        const body = await validateRegister(signUpRequest);
        const user = <IUser>new User();
        user.name = body.name;
        user.login = body.login;
        user.permissions = ["user"];
        user.setStringPassword(body.password);
        //Creamos perfil para el usuario
        const profile = new Profile()
        profile.name = user.name
        profile.user = user._id

        // Then save the user
        await user.save();
        //Guardamos Perfil
        await profile.save();
        return Promise.resolve(user._id.toHexString());
    } catch (err) {
        return Promise.reject(err);
    }
}
function validateRegister(body: SignUpRequest): Promise<SignUpRequest> {
    const result: error.ValidationErrorMessage = {
        messages: []
    };

    if (!body.name || body.name.length <= 0) {
        result.messages.push({ path: "name", message: "No puede quedar vacío." });
    } else if (body.name.length > 1024) {
        result.messages.push({ path: "name", message: "Hasta 1024 caracteres solamente." });
    }

    if (!body.password) {
        result.messages.push({ path: "password", message: "No puede quedar vacío." });
    } else if (body.password.length <= 4) {
        result.messages.push({ path: "password", message: "Mas de 4 caracteres." });
    } else if (body.password.length > 256) {
        result.messages.push({ path: "password", message: "Hasta 256 caracteres solamente." });
    }

    if (!body.login || body.login.length <= 0) {
        result.messages.push({ path: "login", message: "No puede quedar vacío." });
    } else if (body.login.length > 256) {
        result.messages.push({ path: "login", message: "Hasta 256 caracteres solamente." });
    }

    if (result.messages.length > 0) {
        return Promise.reject(result);
    }
    return Promise.resolve(body);
}


export interface SignInRequest {
    password?: string;
    login?: string;
}
export async function login(body: SignInRequest): Promise<string> {
    try {
        body = await validateLogin(body);
        const user = await User.findOne({ login: body.login, enabled: true }).exec();

        if (!user) {
            throw error.newArgumentError("login", "Usuario no encontrado.");
        }

        if (!user.authenticate(body.password)) {
            throw error.newArgumentError("password", "Password incorrecto.");
        }

        return Promise.resolve(user._id.toHexString());
    } catch (error) {
        return Promise.reject(error);
    }
}

function validateLogin(body: SignInRequest): Promise<SignInRequest> {
    const result: error.ValidationErrorMessage = {
        messages: []
    };

    if (!body.password) {
        result.messages.push({ path: "password", message: "No puede quedar vacío." });
    }

    if (!body.login || body.login.length <= 0) {
        result.messages.push({ path: "login", message: "No puede quedar vacío." });
    }

    if (result.messages.length > 0) {
        return Promise.reject(result);
    }
    return Promise.resolve(body);
}

export async function findById(userId: string): Promise<IUser> {
    try {
        const user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            throw error.ERROR_NOT_FOUND;
        }

        return Promise.resolve(user);
    } catch (err) {
        return Promise.reject(err);
    }
}

export function findAll(): Promise<IUser[]> {
    return new Promise<IUser[]>((resolve, reject) => {
        User.find({},
            function (err: any, user: IUser[]) {
                if (err) return reject(err);
                resolve(user);
            });
    });
}


/**
 * Cambiar contraseña
 */
interface ChangePasswordRequest {
    currentPassword?: string;
    newPassword?: string;
}
export async function changePassword(userId: string, body: ChangePasswordRequest): Promise<void> {
    try {
        let user = await validateChangePassword(userId, body);
        user.setStringPassword(body.newPassword);
        user = await user.save();
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}
// esta función es especifica de changePassword , busca y valida un usuario para cambiarle el pass
async function validateChangePassword(userId: string, body: ChangePasswordRequest): Promise<IUser> {
    try {
        const result: error.ValidationErrorMessage = {
            messages: []
        };

        if (!body.currentPassword) {
            result.messages.push({ path: "currentPassword", message: "No puede quedar vacío." });
        } else if (body.currentPassword.length <= 4) {
            result.messages.push({ path: "currentPassword", message: "Mas de 4 caracteres." });
        } else if (body.currentPassword.length > 256) {
            result.messages.push({ path: "currentPassword", message: "Hasta 256 caracteres solamente." });
        }

        if (!body.newPassword) {
            result.messages.push({ path: "newPassword", message: "No puede quedar vacío." });
        } else if (body.newPassword.length <= 4) {
            result.messages.push({ path: "newPassword", message: "Mas de 4 caracteres." });
        } else if (body.newPassword.length > 256) {
            result.messages.push({ path: "newPassword", message: "Hasta 256 caracteres solamente." });
        }

        if (result.messages.length > 0) {
            throw result;
        }

        const user = await User.findOne({ _id: userId, enabled: true }).exec();

        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra.");
        }

        if (!user.authenticate(body.currentPassword)) {
            throw error.newArgumentError("currentPassword", "El password actual es incorrecto.");
        }

        return Promise.resolve(user);
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function hasPermission(userId: string, permission: string): Promise<void> {
    try {
        const user = await User.findOne({ _id: userId, enabled: true }).exec();

        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra.");
        }

        if (!user.hasPermission(permission)) {
            throw error.newError(error.ERROR_INVALID_CREDENTIALS, "Accesos insuficientes");
        }
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}


export async function grant(userId: string, permissions: string[]): Promise<void> {
    try {
        if (!permissions || !(permissions instanceof Array)) {
            throw error.newArgumentError("permissions", "Invalid value");
        }

        let user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        user.grant(permissions);
        user = await user.save();

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function revoke(userId: string, permissions: string[]): Promise<void> {
    try {
        if (!permissions || !(permissions instanceof Array)) {
            throw error.newArgumentError("permissions", "Invalid value");
        }

        let user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        user.revoke(permissions);
        user = await user.save();

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function enable(userId: string): Promise<void> {
    try {
        let user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        user.enabled = true;
        user = await user.save();
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function disable(userId: string): Promise<void> {
    try {
        let user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        user.enabled = false;
        user = await user.save();
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function follow(myUserId: string ,toFollowUserId: string): Promise<IUser> {
    try {
        //Reviso que ambos usuarios existan
        let myUser = await User.findOne({ _id: myUserId }).exec();
        if (!myUser) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }
        let otherUser = await User.findOne({ _id: toFollowUserId }).exec();
        if (!otherUser) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        //Busco que el usuario a seguir no haya sido seguido anteriormente
        var index = myUser.following.indexOf(otherUser._id);
        if (index <= -1) {
            //Si no lo seguia, lo sigo
            myUser.follow(otherUser._id)
            myUser = await myUser.save();
            return Promise.resolve(otherUser);
        } else {
            //Si ya lo seguia salgo con error
            return Promise.reject({
                failAt: "user-follow",
                message: "Ya sigues a este usuario"
            })
        }
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function unfollow(myUserId: string ,toUnfollowUserId: string): Promise<IUser> {
    try {
        //Reviso que ambos usuarios existan
        let myUser = await User.findOne({ _id: myUserId }).exec();
        if (!myUser) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }
        let otherUser = await User.findOne({ _id: toUnfollowUserId }).exec();
        if (!otherUser) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        //Busco que el usuario a seguir haya sido seguido anteriormente
        var index = myUser.following.indexOf(otherUser._id);
        if (index > -1) {
            //Si lo seguia, lo dejo de seguir
            myUser.unfollow(otherUser._id)
            myUser = await myUser.save();
            return Promise.resolve(otherUser);
        } else {
            //Si no lo seguia salgo con error
            return Promise.reject({
                failAt: "user-follow",
                message: "No sigues a este usuario, no puedes dejar de seguirlo"
            })
        }
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function getFollowing(userId: string): Promise<mongoose.Schema.Types.ObjectId[]> {
    try {
        let user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            throw error.newError(error.ERROR_NOT_FOUND, "El usuario no se encuentra");
        }

        return Promise.resolve(user.following);
    } catch (err) {
        return Promise.reject(err);
    }
}