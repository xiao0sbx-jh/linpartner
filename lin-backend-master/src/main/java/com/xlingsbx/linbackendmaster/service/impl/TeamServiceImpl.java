package com.xlingsbx.linbackendmaster.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xlingsbx.linbackendmaster.common.ErrorCode;
import com.xlingsbx.linbackendmaster.exception.BusinessException;
import com.xlingsbx.linbackendmaster.mapper.TeamMapper;
import com.xlingsbx.linbackendmaster.model.domain.Team;
import com.xlingsbx.linbackendmaster.model.domain.User;
import com.xlingsbx.linbackendmaster.model.domain.UserTeam;
import com.xlingsbx.linbackendmaster.model.dto.TeamQuery;
import com.xlingsbx.linbackendmaster.model.enums.TeamStatusEnum;
import com.xlingsbx.linbackendmaster.model.request.TeamJoinRequest;
import com.xlingsbx.linbackendmaster.model.request.TeamQuitRequest;
import com.xlingsbx.linbackendmaster.model.request.TeamUpdateRequest;
import com.xlingsbx.linbackendmaster.model.vo.TeamUserVO;
import com.xlingsbx.linbackendmaster.model.vo.UserVO;
import com.xlingsbx.linbackendmaster.service.TeamService;
import com.xlingsbx.linbackendmaster.service.UserService;
import com.xlingsbx.linbackendmaster.service.UserTeamService;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
* @author xiaoling
* @description 针对表【team(队伍)】的数据库操作Service实现
* @createDate 2026-09-23 17:25:08
*/
@Service
public class TeamServiceImpl extends ServiceImpl<TeamMapper, Team>
    implements TeamService {

    @Resource
    private UserTeamService userTeamService;

    @Resource
    private UserService userService;

    @Resource
    private RedissonClient redissonClient;


    @Override
    @Transactional(rollbackFor = Exception.class)
    public long addTeam(Team team, User loginUser) {
        // 1. 请求参数是否为空？
        if (team == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        // 2. 是否登录，未登录不允许创建
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.NOT_LOGIN);
        }
        final long userId = loginUser.getId();
        // 3. 校验信息
        //   1. 队伍人数 > 1 且 <= 20
        int maxNum = Optional.ofNullable(team.getMaxNum()).orElse(0);
        if (maxNum < 1 || maxNum > 20) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍人数不满足要求");
        }
        //   2. 队伍标题 <= 20
        String name = team.getName();
        if (StringUtils.isBlank(name) || name.length() > 20) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍标题不满足要求");
        }
        //   3. 描述 <= 512
        String description = team.getDescription();
        if (StringUtils.isNotBlank(description) && description.length() > 512) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍描述过长");
        }
        //   4. status 是否公开（int）不传默认为 0（公开）
        int status = Optional.ofNullable(team.getStatus()).orElse(0);
        TeamStatusEnum statusEnum = TeamStatusEnum.getEnumByValue(status);
        if (statusEnum == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍状态不满足要求");
        }
        //   5. 如果 status 是加密状态，一定要有密码，且密码 <= 32
        String password = team.getPassword();
        if (TeamStatusEnum.SECRET.equals(statusEnum)) {
            if (StringUtils.isBlank(password) || password.length() > 32) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "密码设置不正确");
            }
        }
        // 6. 超时时间 > 当前时间（不传则表示永不过期）
        Date expireTime = team.getExpireTime();
        if (expireTime != null && new Date().after(expireTime)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "超时时间 > 当前时间");
        }
        // 7. 校验用户最多创建 5 个队伍（按 userId 加锁，避免并发下超额创建）
        RLock lock = redissonClient.getLock("xiaoling:create_team:lock:" + userId);
        try {
            if (!lock.tryLock(0, -1, TimeUnit.MILLISECONDS)) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "操作过于频繁，请稍后重试");
            }
            long hasTeamNum = this.count(new QueryWrapper<Team>().eq("userId", userId));
            if (hasTeamNum >= 5) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "用户最多创建 5 个队伍");
            }
            // 8. 插入队伍信息到队伍表
            team.setId(null);
            team.setUserId(userId);
            boolean result = this.save(team);
            Long teamId = team.getId();
            if (!result || teamId == null) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "创建队伍失败");
            }
            // 9. 插入用户 => 队伍关系到关系表
            UserTeam userTeam = new UserTeam();
            userTeam.setUserId(userId);
            userTeam.setTeamId(teamId);
            userTeam.setJoinTime(new Date());
            result = userTeamService.save(userTeam);
            if (!result) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "创建队伍失败");
            }
            return teamId;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("addTeam tryLock interrupted", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "创建队伍失败");
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    public List<TeamUserVO> listTeams(TeamQuery teamQuery, boolean isAdmin) {
        QueryWrapper<Team> queryWrapper = new QueryWrapper<>();
        // 组合查询条件
        if (teamQuery != null)  {
            Long id = teamQuery.getId();
            if (id != null && id > 0) {
                queryWrapper.eq("id", id);
            }
            List<Long> idList = teamQuery.getIdList();
            if (CollectionUtils.isNotEmpty(idList)) {
                queryWrapper.in("id", idList);
            }
            String searchText = teamQuery.getSearchText();
            if (StringUtils.isNotBlank(searchText)) {
                queryWrapper.and(qw -> qw.like("name", searchText).or().like("description", searchText));
            }
            String name = teamQuery.getName();
            if (StringUtils.isNotBlank(name)) {
                queryWrapper.like("name", name);
            }
            String description = teamQuery.getDescription();
            if (StringUtils.isNotBlank(description)) {
                queryWrapper.like("description", description);
            }
            Integer maxNum = teamQuery.getMaxNum();
            // 查询最大人数相等的
            if (maxNum != null && maxNum > 0) {
                queryWrapper.eq("maxNum", maxNum);
            }
            Long userId = teamQuery.getUserId();
            // 根据创建人来查询
            if (userId != null && userId > 0) {
                queryWrapper.eq("userId", userId);
            }
            // 根据状态来查询：非管理员只能看到公开队伍
            Integer status = teamQuery.getStatus();
            TeamStatusEnum statusEnum = TeamStatusEnum.getEnumByValue(status);
            if (statusEnum == null) {
                // 未指定状态时，普通用户只能看公开队伍，管理员不限
                if (!isAdmin) {
                    queryWrapper.eq("status", TeamStatusEnum.PUBLIC.getValue());
                }
            } else {
                if (!isAdmin && statusEnum.equals(TeamStatusEnum.PRIVATE)) {
                    throw new BusinessException(ErrorCode.NO_AUTH);
                }
                queryWrapper.eq("status", statusEnum.getValue());
            }
        }
        // 不展示已过期的队伍：expireTime is null or expireTime > now()
        queryWrapper.and(qw -> qw.gt("expireTime", new Date()).or().isNull("expireTime"));
        List<Team> teamList = this.list(queryWrapper);
        if (CollectionUtils.isEmpty(teamList)) {
            return new ArrayList<>();
        }
        // 批量查询创建人信息，避免 N+1
        Set<Long> userIdSet = teamList.stream()
                .map(Team::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> userIdUserMap = new HashMap<>();
        if (CollectionUtils.isNotEmpty(userIdSet)) {
            QueryWrapper<User> userQueryWrapper = new QueryWrapper<>();
            userQueryWrapper.select("id", "username", "userAccount", "avatarUrl",
                    "gender", "phone", "email", "planetCode", "tags", "userRole",
                    "userStatus", "createTime");
            userQueryWrapper.in("id", userIdSet);
            userIdUserMap = userService.list(userQueryWrapper).stream()
                    .collect(Collectors.toMap(User::getId, user -> user, (a, b) -> a));
        }
        List<TeamUserVO> teamUserVOList = new ArrayList<>();
        for (Team team : teamList) {
            TeamUserVO teamUserVO = new TeamUserVO();
            BeanUtils.copyProperties(team, teamUserVO);
            // 脱敏用户信息
            User user = userIdUserMap.get(team.getUserId());
            if (user != null) {
                UserVO userVO = new UserVO();
                BeanUtils.copyProperties(user, userVO);
                teamUserVO.setCreateUser(userVO);
            }
            teamUserVOList.add(teamUserVO);
        }
        return teamUserVOList;
    }

    @Override
    public boolean updateTeam(TeamUpdateRequest teamUpdateRequest, User loginUser) {
        if (teamUpdateRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Long id = teamUpdateRequest.getId();
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Team oldTeam = this.getById(id);
        if (oldTeam == null) {
            throw new BusinessException(ErrorCode.NULL_ERROR, "队伍不存在");
        }
        // 只有管理员或者队伍的创建者可以修改
        if (!oldTeam.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH);
        }
        // 校验队伍名称
        String name = teamUpdateRequest.getName();
        if (StringUtils.isNotBlank(name) && name.length() > 20) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍标题不满足要求");
        }
        // 校验描述
        String description = teamUpdateRequest.getDescription();
        if (StringUtils.isNotBlank(description) && description.length() > 512) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍描述过长");
        }
        // 校验最大人数
        Integer maxNum = teamUpdateRequest.getMaxNum();
        if (maxNum != null && (maxNum < 1 || maxNum > 20)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍人数不满足要求");
        }
        // 校验过期时间必须晚于当前时间
        Date expireTime = teamUpdateRequest.getExpireTime();
        if (expireTime != null && new Date().after(expireTime)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "超时时间 > 当前时间");
        }
        // 校验状态合法性，status 不传则沿用原队伍状态
        Integer status = teamUpdateRequest.getStatus();
        TeamStatusEnum statusEnum = TeamStatusEnum.getEnumByValue(status);
        if (status != null && statusEnum == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍状态不满足要求");
        }
        if (statusEnum == null) {
            statusEnum = TeamStatusEnum.getEnumByValue(oldTeam.getStatus());
        }
        // 加密队伍必须设置密码，且密码长度 <= 32
        if (TeamStatusEnum.SECRET.equals(statusEnum)) {
            String password = StringUtils.isNotBlank(teamUpdateRequest.getPassword())
                    ? teamUpdateRequest.getPassword() : oldTeam.getPassword();
            if (StringUtils.isBlank(password) || password.length() > 32) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "加密房间必须要设置密码");
            }
        }
        Team updateTeam = new Team();
        BeanUtils.copyProperties(teamUpdateRequest, updateTeam);
        return this.updateById(updateTeam);
    }

    @Override
    public boolean joinTeam(TeamJoinRequest teamJoinRequest, User loginUser) {
        if (teamJoinRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Long teamId = teamJoinRequest.getTeamId();
        Team team = getTeamById(teamId);
        Date expireTime = team.getExpireTime();
        if (expireTime != null && expireTime.before(new Date())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍已过期");
        }
        Integer status = team.getStatus();
        TeamStatusEnum teamStatusEnum = TeamStatusEnum.getEnumByValue(status);
        if (TeamStatusEnum.PRIVATE.equals(teamStatusEnum)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "禁止加入私有队伍");
        }
        String password = teamJoinRequest.getPassword();
        if (TeamStatusEnum.SECRET.equals(teamStatusEnum)) {
            if (StringUtils.isBlank(password) || !password.equals(team.getPassword())) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "密码错误");
            }
        }
        long userId = loginUser.getId();
        // 按队伍加锁，不同队伍之间不互相阻塞
        RLock lock = redissonClient.getLock("xiaoling:join_team:lock:" + teamId);
        try {
            if (!lock.tryLock(0, -1, TimeUnit.MILLISECONDS)) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "操作过于频繁，请稍后重试");
            }
            // 该用户已加入的队伍数量（含自己创建的队伍）
            long hasJoinNum = userTeamService.count(new QueryWrapper<UserTeam>().eq("userId", userId));
            if (hasJoinNum >= 5) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "最多加入 5 个队伍");
            }
            // 不能重复加入已加入的队伍
            long hasUserJoinTeam = userTeamService.count(new QueryWrapper<UserTeam>()
                    .eq("userId", userId)
                    .eq("teamId", teamId));
            if (hasUserJoinTeam > 0) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "用户已加入该队伍");
            }
            // 已加入队伍的人数
            long teamHasJoinNum = this.countTeamUserByTeamId(teamId);
            if (teamHasJoinNum >= team.getMaxNum()) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "队伍已满");
            }
            UserTeam userTeam = new UserTeam();
            userTeam.setUserId(userId);
            userTeam.setTeamId(teamId);
            userTeam.setJoinTime(new Date());
            return userTeamService.save(userTeam);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("joinTeam tryLock interrupted", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "加入队伍失败");
        } finally {
            // 只能释放自己的锁
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * 根据 id 获取队伍信息
     *
     * @param teamId
     * @return
     */
    private Team getTeamById(Long teamId) {
        if (teamId == null || teamId <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Team team = this.getById(teamId);
        if (team == null) {
            throw new BusinessException(ErrorCode.NULL_ERROR, "队伍不存在");
        }
        return team;
    }

    /**
     * 获取某队伍当前人数
     *
     * @param teamId
     * @return
     */
    private long countTeamUserByTeamId(long teamId) {
        QueryWrapper<UserTeam> userTeamQueryWrapper = new QueryWrapper<>();
        userTeamQueryWrapper.eq("teamId", teamId);
        return userTeamService.count(userTeamQueryWrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteTeam(long id, User loginUser) {
        // 校验队伍是否存在
        Team team = getTeamById(id);
        long teamId = team.getId();
        // 校验你是不是队伍的队长（管理员也可删除）
        if (!team.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH, "无访问权限");
        }
        // 移除所有加入队伍的关联信息
        QueryWrapper<UserTeam> userTeamQueryWrapper = new QueryWrapper<>();
        userTeamQueryWrapper.eq("teamId", teamId);
        userTeamService.remove(userTeamQueryWrapper);
        // 删除队伍
        boolean result = this.removeById(teamId);
        if (!result) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "删除队伍失败");
        }
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean quitTeam(TeamQuitRequest teamQuitRequest, User loginUser) {
        if (teamQuitRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Long teamId = teamQuitRequest.getTeamId();
        Team team = getTeamById(teamId);
        long userId = loginUser.getId();
        UserTeam queryUserTeam = new UserTeam();
        queryUserTeam.setTeamId(teamId);
        queryUserTeam.setUserId(userId);
        QueryWrapper<UserTeam> queryWrapper = new QueryWrapper<>(queryUserTeam);
        long count = userTeamService.count(queryWrapper);
        if (count == 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "未加入队伍");
        }
        long teamHasJoinNum = this.countTeamUserByTeamId(teamId);
        // 队伍只剩一人，解散
        if (teamHasJoinNum == 1) {
            // 删除队伍及其关联关系
            this.removeById(teamId);
            return userTeamService.remove(queryWrapper);
        }
        // 队伍还剩至少两人，若退出者是队长则转移队长
        if (team.getUserId().equals(userId)) {
            // 把队伍转移给最早加入的用户（按加入时间升序，第一条是队长自己）
            QueryWrapper<UserTeam> userTeamQueryWrapper = new QueryWrapper<>();
            userTeamQueryWrapper.eq("teamId", teamId);
            userTeamQueryWrapper.orderByAsc("joinTime", "id");
            userTeamQueryWrapper.last("limit 2");
            List<UserTeam> userTeamList = userTeamService.list(userTeamQueryWrapper);
            if (userTeamList.size() <= 1) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR);
            }
            Long nextTeamLeaderId = userTeamList.get(1).getUserId();
            // 更新当前队伍的队长
            Team updateTeam = new Team();
            updateTeam.setId(teamId);
            updateTeam.setUserId(nextTeamLeaderId);
            boolean result = this.updateById(updateTeam);
            if (!result) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "更新队伍队长失败");
            }
        }
        // 移除关系
        return userTeamService.remove(queryWrapper);
    }



}




