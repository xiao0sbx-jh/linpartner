package com.xlingsbx.linbackendmaster.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xlingsbx.linbackendmaster.common.BaseResponse;
import com.xlingsbx.linbackendmaster.common.ErrorCode;
import com.xlingsbx.linbackendmaster.common.ResultUtils;
import com.xlingsbx.linbackendmaster.exception.BusinessException;
import com.xlingsbx.linbackendmaster.model.domain.Team;
import com.xlingsbx.linbackendmaster.model.domain.UserTeam;
import com.xlingsbx.linbackendmaster.model.dto.TeamQuery;
import com.xlingsbx.linbackendmaster.service.TeamService;
import com.xlingsbx.linbackendmaster.service.UserService;
import com.xlingsbx.linbackendmaster.service.UserTeamService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequestMapping("/team")
public class TeamController {

    @Autowired
    private UserService userService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private UserTeamService userTeamService;


    @PostMapping("/add")
    public BaseResponse<Long> addTeam(@RequestBody Team team) {
        if (team == null) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        boolean save = teamService.save(team);
        if (!save) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,"插入失败");
        }
        return ResultUtils.success(team.getId());
    }

    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteTeam(@RequestBody long id) {
        if (id <= 0) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        boolean delete = teamService.removeById(id);
        if (!delete) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,"删除失败");
        }
        return ResultUtils.success(true);
    }

    @PostMapping("/update")
    public BaseResponse<Boolean> updateTeam(@RequestBody Team team) {
        if (team == null) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        boolean res = teamService.updateById(team);
        if (!res) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,"删除失败");
        }
        return ResultUtils.success(true);
    }

    @GetMapping("/get")
    public BaseResponse<Team> getTeam(@RequestParam long id) {
        if (id <= 0) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        Team team = teamService.getById(id);
        if (team == null) throw new BusinessException(ErrorCode.NULL_ERROR);
        return ResultUtils.success(team);
    }

    @GetMapping("/list")
    public BaseResponse<List<Team>> listTeams(@RequestParam TeamQuery teamQuery) {
        if (teamQuery == null) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        Team team = new Team();
        try {
            BeanUtils.copyProperties(team,teamQuery );
        } catch (BeansException e) {
            throw new RuntimeException(e);
        }
        QueryWrapper<Team> queryWrapper = new QueryWrapper<Team>();
        List<Team> teams = teamService.list(queryWrapper);
        return  ResultUtils.success(teams);
    }

    /*@GetMapping("/list/page")
    public BaseResponse<Page<Team>> listTeamsByPages(@RequestParam TeamQuery teamQuery) {
        if (teamQuery == null) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        Team team = new Team();
        try {
            BeanUtils.copyProperties(team,teamQuery );
        } catch (BeansException e) {
            throw new RuntimeException(e);
        }
        QueryWrapper<Team> queryWrapper = new QueryWrapper<Team>();
        List<Team> teams = teamService.list(queryWrapper);
        return  ResultUtils.success(teams);
    }*/


}
