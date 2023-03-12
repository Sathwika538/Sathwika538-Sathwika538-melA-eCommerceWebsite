import React, { Fragment,useEffect,useState }  from "react";
import './ResetPassword.css';
import {useSelector,useDispatch} from "react-redux";
import {resetPassword,clearErrors} from "../../actions/userAction";
import {useAlert} from 'react-alert';
import {useNavigate} from "react-router-dom";
import MetaData from "../layout/MetaData";
import Loader from "../layout/Loader/Loader";
import LockOpenIcon from '@material-ui/icons/LockOpen';
import LockIcon from '@material-ui/icons/Lock';
import { useParams } from "react-router-dom";

const ResetPassword = () =>{
    const dispatch = useDispatch();
    const alert = useAlert();
    const navigate = useNavigate();
    const { token }= useParams();

    const {error,success,loading} = useSelector(state=>(state.forgotPassword));

    const [password,setPassword] = useState("");
    const [confirmPassword,setConfirmPassword] = useState("");

    const resetPasswordSubmit = (e)=> {
        e.preventDefault();

        const myForm = new FormData();

        myForm.set("password",password);
        myForm.set("confirmPassword",confirmPassword);
        dispatch(resetPassword(token,myForm));
    }

    
    useEffect(()=>{
        if(error){
            alert.error(error);
            dispatch(clearErrors());
        }
        if(success){
            alert.success("Password Updated Successfully !");
            navigate("/login");
           
        }
    },[dispatch,error,alert,success,navigate]);
    return  <Fragment>
    {loading ? <Loader /> :  <Fragment>
       <MetaData title="Change Password"/>
        <div className="resetPasswordContainer">
        <div className="resetPasswordBox">
        <h2 className="resetPasswordHeading">Update Password</h2>
        <form
            className="resetPasswordForm"
            onSubmit={resetPasswordSubmit}
            >
               
            <div >
                <LockOpenIcon />
                    <input 
                        type="password"
                        placeholder="New Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}    
                    />
            </div> 
            <div className="loginPassword">
                <LockIcon />
                    <input 
                        type="password"
                        placeholder="Confirm Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}    
                    />
            </div> 
            <input 
                    type="submit"
                    value="Update Password"
                    className = "resetPasswordBtn"
            />
            </form>
        </div>
          </div>
    </Fragment>}
   </Fragment>
}

export default ResetPassword;