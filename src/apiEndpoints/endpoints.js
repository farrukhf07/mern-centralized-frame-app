const BASE_URL = "http://172.16.3.214:3003/api";

export const API_ENDPOINTS = {
    
    ////////////////////////
    /////////Auth///////////
    ////////////////////////
    LOGIN:`${BASE_URL}/auth/login`,
    CREATE_USER:`${BASE_URL}/auth/createUser`,
    GET_ALL_USERS:`${BASE_URL}/user/all-users`,
    UPDATE_USER:(id)=>
        `${BASE_URL}/user/users/${id}`,
    DELETE_USER:(id)=>
        `${BASE_URL}/auth/delete/${id}`,
    GET_ME:`${BASE_URL}/user/me`,

    GET_ALL_APPS: `${BASE_URL}/app/get-all-app`,
    CREATE_NEW_APP: `${BASE_URL}/app/create-new-app`,
    UPDATE_APP: (id) => `${BASE_URL}/app/update-app/${id}`,
    DELETE_APP: (id) => `${BASE_URL}/app/delete-app/${id}`,

    ////////////////////////
    ///////Categories///////
    ////////////////////////
    GET_ALL_CATEGORIES: `${BASE_URL}/category/getAllCategories`,
    GET_APP_CATEGORY:(appId)=>
        `${BASE_URL}/category/getCategories/${appId}`,
    CREATE_NEW_CATEGORY:(appId)=>
        `${BASE_URL}/category/createCategory/${appId}`,
    ADD_EXISTING_CATEGORY_TO_APP:(appId)=>
        `${BASE_URL}/category/addExistingCategoryToApp/${appId}`,
    REMOVE_CATEGORY_FROM_APP:(appId)=>
        `${BASE_URL}/category/removeCategoryFromApp/${appId}`,
    UPDATE_CATEGORY:(id)=>
        `${BASE_URL}/category/editCategory/${id}`,
    GET_CATEGORY_BY_ID:(id)=>
        `${BASE_URL}/category/getCategoryById/${id}`,
    DELETE_CATEGORY:(id)=>
        `${BASE_URL}/category/deleteCategory/${id}`,    

    ////////////////////////
    /////////Asets//////////
    ////////////////////////
    // CREATE_NEW_ASSET: `${BASE_URL}/asset/createAsset`,
    GET_ASSETS_LIST: `${BASE_URL}/asset/assetList`,
    GET_ASSETS_OF_CATEGORY:(categoryId)=>
        `${BASE_URL}/asset/category/${categoryId}`,
    GET_ASSET_BY_ID:(id)=>
        `${BASE_URL}/asset/asset/${id}`,
    UPDATE_ASSET:(assetId)=>
        `${BASE_URL}/asset/editAsset/${assetId}`,
    DELETE_ASSET:(assetId)=>
        `${BASE_URL}/asset/deleteAsset/${assetId}`,
    UPDATE_BULK_COORDINATES: `${BASE_URL}/asset/updatebulkCoordinates`,
    DELETE_APP_CONTENT_BY_CATEGORY:(categoryId)=>
        `${BASE_URL}/appConfig/appcontents/${categoryId}`,

    ////////////////////////
    ///////Config Api///////
    ////////////////////////
    GET_APP_VIEW: (appId) => `${BASE_URL}/appConfig/view/${appId}`,
    CREATE_APP_CATEGORY: (appId) => `${BASE_URL}/appConfig/createCategory/${appId}`,
    CREATE_ASSET_AND_LINK: `${BASE_URL}/appConfig/createAsset`,
    ADD_EXISTING_CATEGORY: `${BASE_URL}/appConfig/addExistingCategory`,
    DELETE_APP_CATEGORY: `${BASE_URL}/appConfig/deleteCategory`,
    REMOVE_ASSET_FROM_APP: `${BASE_URL}/appConfig/removeAsset`,
    ADD_EXISTING_ASSETS: `${BASE_URL}/appConfig/add-existing-assets`,

    ////////////////////////
    ////Contact Request/////
    ////////////////////////
    SEND_MAIL:`${BASE_URL}/contact/sendMail`,
    GET_ALL_REQUEST:`${BASE_URL}/contact/requests`,
    ACCEPT_EMAIL_REQUEST:(id)=>
        `${BASE_URL}/contact/requests/accept/${id}`,
    REJECT_EMAIL_REQUEST:(id)=>
        `${BASE_URL}/contact/requests/reject/${id}`,
    DELETE_EMAIL_REQUEST:(id)=>
        `${BASE_URL}/contact/requests/deleteRequest/${id}`,
};