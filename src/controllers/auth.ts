import { Request, Response, NextFunction } from "express";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user";

export const signup = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { email, password }: { email: string; password: string } = req.body;

	if (!email || !password) {
		return next({
			status: 422,
			name: "MissingAuthData",
			message: "Email or password is missing."
		});
	}

	if (!validator.isEmail(email)) {
		return next({
			status: 422,
			name: "InvalidEmail",
			message: "Provided E-mail address is invalid."
		});
	}

	if (password.length < 8) {
		return next({
			status: 422,
			name: "TooShortPassword",
			message: "Provided password is too short."
		});
	}

	const user = await User.findOne({ email });
	if (!user) {
	} else {
		next({
			status: 400,
			name: "AlreadyRegistered",
			message: "Provided e-mail is alrady registered. Please Log In."
		});
	}
};

export const login = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next({
			status: 422,
			name: "MissingAuthData",
			message: "Email or password is missing."
		});
	}

	if (!validator.isEmail(email)) {
		return next({
			status: 422,
			name: "InvalidEmail",
			message: "Email is invalid."
		});
	}

	const user = await User.findOne({ email });
	if (user) {
		if (await bcrypt.compare(password, user.password)) {
			const token = await jwt.sign(
				{ id: user._id },
				process.env.JWT_PRIVATE_KEY,
				{ expiresIn: "2d" }
			);
			const expiresAt = Math.floor(Date.now() / 1000 + 172800);
			res.status(200).json({
				name: "Success",
				message: "User authenticated successfully.",
				data: {
					token,
					expiresAt
				}
			});
		} else {
			return next({
				status: 401,
				name: "PasswordMismatch",
				message: "Provided password is incorrect."
			});
		}
	} else {
		return next({
			status: 404,
			name: "UserNotFound",
			message: "Provided e-mail is not registered yet."
		});
	}
};
