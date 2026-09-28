package com.xlingsbx.linbackendmaster.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.xlingsbx.linbackendmaster.model.domain.Team;
import com.xlingsbx.linbackendmaster.model.domain.User;
import com.xlingsbx.linbackendmaster.model.dto.TeamQuery;
import com.xlingsbx.linbackendmaster.model.vo.TeamUserVO;

import java.util.List;

/**
* @author xiaoling
* @description 针对表【team(队伍)】的数据库操作Service
* @createDate 2026-09-23 17:25:08
*/
public interface TeamService extends IService<Team> {

    public long addTeam(Team team, User loginUser);


    List<TeamUserVO> listTeams(TeamQuery teamQuery, boolean isAdmin);
}
