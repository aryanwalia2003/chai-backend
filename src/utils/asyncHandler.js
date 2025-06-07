const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>{next(err)})
    }
}


export { asyncHandler };

/*
const asyncHandler=(func)=>{async (req,res,next)=>{
    try {
        await func(res,req,next)
    } catch (error) {
        res.status(error.code||500).json({
            success:false,
            message:error.message||"Internal Server Error"
        })
    }
}}
*/