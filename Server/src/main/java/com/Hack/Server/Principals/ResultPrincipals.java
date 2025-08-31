package com.Hack.Server.Principals;
import com.Hack.Server.Model.Result;
import com.Hack.Server.Repo.ResultRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.Hack.Server.Services.ResultServices;

@Service
public class ResultPrincipals implements ResultServices {

    @Autowired
    private ResultRepo resultRepo;

    @Override
    public Result SaveResult(Result R) {
            if(resultRepo.save(R)!=null){
                System.out.println(HttpStatus.OK);
            }
            else{
                System.out.println("Somthing went Wrong");
            }
            // return HttpStatus.OK;
            return R;
        }
}


