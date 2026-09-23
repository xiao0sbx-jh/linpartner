package com.xlingsbx.linbackendmaster.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xlingsbx.linbackendmaster.mapper.TeamMapper;
import com.xlingsbx.linbackendmaster.model.domain.Team;
import com.xlingsbx.linbackendmaster.service.TeamService;
import org.springframework.stereotype.Service;

/**
* @author xiaoling
* @description 针对表【team(队伍)】的数据库操作Service实现
* @createDate 2026-09-23 17:25:08
*/
@Service
public class TeamServiceImpl extends ServiceImpl<TeamMapper, Team>
    implements TeamService {

}




