import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from front end or mean postman
  // Validation -no empty
  // check if user already exsit: username,email
  // check for images, check for avatar
  // upload then to cloudinary ,avatar
  // create user object - create entry in db
  // remove password and refresh token fields from response
  // check for user creation

  const { username, email, fullname, password } = req.body;
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field is required.");
  }
  const exsitedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (exsitedUser) {
    throw new ApiError(409, "username and email already exsit.");
  }

  const avatarLocalPath = req.files?.avatar[0].path;
  // const coverImageLocalPath = req.files?.coverImage[0].path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );
  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while registring the User");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered Successfully."));
});

export { registerUser };
