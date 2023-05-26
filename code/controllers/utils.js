import jwt from 'jsonwebtoken'

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
    const {from, upTo, date} = req;
    if(date){
        if(from || upTo){
            throw ("Unauthorized query parameters");
        }
        // filter by date
        let StartDateFilter = new Date(`${date}T00:00:00.000Z`); 
        let EndDateFilter = new Date(`${date}T23:59:59.999Z`); 
        return { date: { $gte: StartDateFilter, $lte: EndDateFilter} };
    }
    else{

        if(from && !upTo){  //filter only by 'from' parameter
            let fromDateFilter = new Date(`${from}T00:00:00.000Z`);
            return {date: { $gte: fromDateFilter }};
        }
        else if (upTo && !from){ //filter only by 'upTo' parameter
            let upToDateFilter = new Date(`${upTo}T23:59:59.999Z`);
            return {date: { $lte: upToDateFilter }};
        }
        else if (from && upTo){ //filter by 'from' and 'upTo' parameter
            let fromDateFilter = new Date(`${from}T00:00:00.000Z`);
            let upToDateFilter = new Date(`${upTo}T23:59:59.999Z`);
            
            return { date: { $gte: fromDateFilter, $lte: upToDateFilter} };
        }
        else{   // no filtering
            return {}
        }
    }
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */

export const verifyAuth = (req, res, info) => {
    // Simple Authtype check
    const cookie = req.cookies;

    if (info.authType === "Simple" && (cookie.accessToken || cookie.refreshToken) ) {
        return { authorized: true, cause: "Authorized" }
    }
    if (!cookie.accessToken || !cookie.refreshToken) {
        return { authorized: false, cause: "Unauthorized" };
    }

    try {
        
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);

        const currentTime2 = Date.now();
        const remainingTime2 = decodedAccessToken.exp*1000 - currentTime2;
        
        // Convert remaining time to seconds, minutes, or hours as needed
        const remainingSeconds = Math.floor(remainingTime2 / 1000);
        const remainingMinutes = Math.floor(remainingTime2 / 60000);
        const remainingHours = Math.floor(remainingTime2 / 3600000);
        
        console.log('Remaining time in minutes:', remainingMinutes);
        console.log('Remaining time in hours:', remainingHours);

        const currentTime = Date.now();
        const remainingTime = decodedRefreshToken.exp*1000 - currentTime;
        
        // Convert remaining time to seconds, minutes, or hours as needed
        const remainingSeconds2 = Math.floor(remainingTime / 1000);
        const remainingMinutes2 = Math.floor(remainingTime / 60000);
        const remainingHours2= Math.floor(remainingTime / 3600000);
        
        console.log('Remaining time in minutes:', remainingMinutes2);
        console.log('Remaining time in hours:', remainingHours2);
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return { authorized: false, cause: "Token is missing information" }
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return { authorized: false, cause: "Token is missing information" }
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return { authorized: false, cause: "Mismatched users" };
        }
        // User authType check
        if (info.authType === 'User' && info.username !== decodedAccessToken.username ) {
            return { authorized: false, cause: "User: Mismatched users" };
        }
        if (info.authType === 'Admin' && (decodedAccessToken.role !== 'Admin' || decodedRefreshToken.role !== 'Admin')) {
            return { authorized: false, cause: "Admin: Mismatched role" };
        }
        if (info.authType === 'Group') {
            let in_group = false;
            for (let email of info.emails) {
                if (email === decodedAccessToken.email) {
                    in_group = true;
                }
            }
            if (in_group === false) {
                return { authorized: false, cause: "Group: user not in group" };
            }
        }
        return { authorized: true, cause: "Authorized" }
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            try {
                // Access Token expired
                const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                
                if ( info.authType==="User" && info.username !== refreshToken.username ) {
                    return { authorized: false, cause: "Token Expired: Mismatched users" };
                }
                if (info.authType === 'Admin' && refreshToken.role !== 'Admin') {
                    return { authorized: false, cause: "Admin: Access Token Expired and Mismatched role" };
                }
                if (info.authType === 'Group') {
                    let in_group = false;
                    for (let email of info.emails) {
                        if (email === refreshToken.email) {
                            in_group = true;
                        }
                    }
                    if (in_group === false) {
                        return { authorized: false, cause: "Group: Access Token Expired and user not in group" };
                    }
                }
                const newAccessToken = jwt.sign({
                    username: refreshToken.username,
                    email: refreshToken.email,
                    id: refreshToken.id,
                    role: refreshToken.role
                }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                res.locals.refreshedTokenMessage= 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
                const currentTime2 = Date.now();
                const axxx = jwt.verify(newAccessToken,process.env.ACCESS_KEY)
                const remainingTime2 = axxx.exp*1000 - currentTime2;
                
                // Convert remaining time to seconds, minutes, or hours as needed
                const remainingSeconds = Math.floor(remainingTime2 / 1000);
                const remainingMinutes = Math.floor(remainingTime2 / 60000);
                const remainingHours = Math.floor(remainingTime2 / 3600000);
                
                console.log('Catch:Remaining time in minutes:', remainingMinutes);
                console.log('Catch:Remaining time in hours:', remainingHours);
        
                const currentTime = Date.now();
                const remainingTime = refreshToken.exp*1000 - currentTime;
                
                // Convert remaining time to seconds, minutes, or hours as needed
                const remainingSeconds2 = Math.floor(remainingTime / 1000);
                const remainingMinutes2 = Math.floor(remainingTime / 60000);
                const remainingHours2= Math.floor(remainingTime / 3600000);
                
                console.log('Catch:Remaining time in minutes:', remainingMinutes2);
                console.log('Catch:Remaining time in hours:', remainingHours2);
                return { authorized: true, cause: "Authorized" }

            } catch (err) {
                // Refresh Token expired
                if (err.name === "TokenExpiredError") {
                    return { authorized: false, cause: "Perform login again" }
                } else {
                    return { authorized: false, cause: err.name }
                }
            }
        } else {
            return { authorized: false, cause: err.name };
        }
    }
}

//CHIAMATA A VERIFYAUTH
/*
export const getUser = async (req, res) => {
  try {
    const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
    if (userAuth.authorized) {
      //User auth successful
    } else {
      const adminAuth = verifyAuth(req, res, { authType: "Admin" })
      if (adminAuth.authorized) {
        //Admin auth successful
      } else {
        res.status(401).json({ error: adminAuth.cause})
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
*/

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {
    const {min, max} = req;
    if(min && !max){
        // filter only by 'min'
        let minFilter = parseInt(min);
        return { amount: { $gte: minFilter} };
    }
    else if(max && !min){
        // filter only by 'max'
        let maxFilter = parseInt(max);
        return { amount: { $lte: maxFilter} };
    }
    else if(min && max){
        // filter by 'min' and 'max'
        let minFilter = parseInt(min);
        let maxFilter = parseInt(max);
        return { amount: { $gte: minFilter, $lte: maxFilter} };
    }
    else{
        // no filtering
        return {}
    }
}