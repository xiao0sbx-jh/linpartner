package com.xlingsbx.linbackendmaster.controller;


import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xlingsbx.linbackendmaster.common.BaseResponse;
import com.xlingsbx.linbackendmaster.common.ErrorCode;
import com.xlingsbx.linbackendmaster.common.ResultUtils;
import com.xlingsbx.linbackendmaster.exception.BusinessException;
import com.xlingsbx.linbackendmaster.model.domain.User;
import com.xlingsbx.linbackendmaster.model.request.UserLoginRequest;
import com.xlingsbx.linbackendmaster.model.request.UserRegisterRequest;
import com.xlingsbx.linbackendmaster.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.xlingsbx.linbackendmaster.constant.UserConstant.USER_LOGIN_STATE;

@RestController
@RequestMapping("/user")
@Slf4j

public class UserController {

    @Autowired
    private UserService userService;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @PostMapping("/register")
    public BaseResponse<Long> userRegister(@RequestBody UserRegisterRequest userRegisterRequest) {
        if (userRegisterRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String userAccount = userRegisterRequest.getUserAccount();
        String userPassword = userRegisterRequest.getUserPassword();
        String checkPassword = userRegisterRequest.getCheckPassword();
        String planetCode = userRegisterRequest.getPlanetCode();
        if (StringUtils.isAnyBlank(userAccount, userPassword, checkPassword, planetCode)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "参数为空");
        }
        long result = userService.userRegister(userAccount, userPassword, checkPassword, planetCode);
        return ResultUtils.success(result);
    }

    @PostMapping("/login")
    public BaseResponse<User> userLogin(@RequestBody UserLoginRequest userLoginRequest, HttpServletRequest request) {
        if (userLoginRequest == null) {
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        String userAccount = userLoginRequest.getUserAccount();
        String userPassword = userLoginRequest.getUserPassword();
        if (StringUtils.isAnyBlank(userAccount, userPassword)) {
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        User user = userService.userLogin(userAccount, userPassword, request);
        return ResultUtils.success(user);
    }

    @PostMapping("/logout")
    public BaseResponse<Integer> userLogout(HttpServletRequest request) {
        if (request == null) {
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        int result = userService.userLogout(request);
        return ResultUtils.success(result);
    }

    @PostMapping("/current")
    public BaseResponse<User> getCurrentUser(HttpServletRequest request) {

        Object objuser = request.getSession().getAttribute(USER_LOGIN_STATE);
        User curUser = (User) objuser;
        if (curUser == null) {
            throw new BusinessException(ErrorCode.NOT_LOGIN);
        }

        long userId = curUser.getId();
        User user = userService.getById(userId);
        User safetyUser = userService.getSafetyUser(user);
        return ResultUtils.success(safetyUser);


    }

    @PostMapping("/search")
    public BaseResponse<List<User>> searchUsers(String username, HttpServletRequest request) {
        if(!userService.isAdmin(request)){
            throw new BusinessException(ErrorCode.NO_AUTH);
        }

        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        if (username != null) {
            queryWrapper.like("username", username);
        }
        List<User> userList = userService.list(queryWrapper);
        List<User> list = userList.stream().map(user -> userService.getSafetyUser(user)).collect(Collectors.toList());
        return ResultUtils.success(list);


    }

    @PostMapping("/search/tag")
    public BaseResponse<Page<User>> searchUsersByTags(@RequestParam(required = false) List<String> tagNameList,
                                                      @RequestParam(defaultValue = "1") long pageNum,
                                                      @RequestParam(defaultValue = "12") long pageSize) {
        if(CollectionUtils.isEmpty(tagNameList)){
            return  ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        Page<User> userPage = userService.searchUsersByTags(tagNameList, pageNum, pageSize);
        return ResultUtils.success(userPage);
    }

    @PostMapping("/update")
    public BaseResponse<Integer> updateUser(@RequestBody User user, HttpServletRequest request) {
        // 校验参数是否为空
        if (user == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        int result = userService.updateUser(user, loginUser, request);
        return ResultUtils.success(result);
    }

    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteUser(@RequestBody long id, HttpServletRequest request) {
        if (id <= 0) {
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        if (!userService.isAdmin(request)) {
            return ResultUtils.error(ErrorCode.NO_AUTH);
        }

        boolean result = userService.removeById(id);
        return ResultUtils.success(result);

    }

    @GetMapping("/recommend")
    public BaseResponse<Page<User>> recommendUsers(long pageSize, long pageNum, HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        // 分页参数校验，避免超大 pageSize 拖垮数据库
        pageSize = Math.min(Math.max(pageSize, 1), 50);
        pageNum = Math.max(pageNum, 1);
        // 缓存 key 需区分分页参数，否则换页会拿到第一页的缓存
        String redisKey = String.format("xiaoling:user:recommend:%s:%s:%s",
                loginUser.getId(), pageNum, pageSize);
        ValueOperations<String, Object> valueOperations = redisTemplate.opsForValue();
        // 如果有缓存，直接读缓存
        try {
            Page<User> userPage = (Page<User>) valueOperations.get(redisKey);
            if (userPage != null) {
                return ResultUtils.success(userPage);
            }
        } catch (Exception e) {
            log.error("redis get key error", e);
        }
        // 无缓存，查数据库
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        Page<User> userPage = userService.page(new Page<>(pageNum, pageSize), queryWrapper);
        // 写缓存，缓存的是脱敏后的用户数据
        Page<User> safetyPage = new Page<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());
        safetyPage.setRecords(userPage.getRecords().stream()
                .map(user -> userService.getSafetyUser(user))
                .collect(Collectors.toList()));
        try {
            valueOperations.set(redisKey, safetyPage, 30000, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.error("redis set key error", e);
        }
        return ResultUtils.success(safetyPage);
    }

    @GetMapping("/match")
    public BaseResponse<List<User>> matchUsers(long num,HttpServletRequest request) {
        if (num <= 0 || num >=20) {return ResultUtils.error(ErrorCode.PARAMS_ERROR);}
        User user = userService.getLoginUser(request);
        return ResultUtils.success(userService.matchUsers(num,user));
    }



}
