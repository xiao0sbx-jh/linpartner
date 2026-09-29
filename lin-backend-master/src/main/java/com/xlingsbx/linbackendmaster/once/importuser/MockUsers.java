package com.xlingsbx.linbackendmaster.once.importuser;

import com.xlingsbx.linbackendmaster.model.domain.User;
import com.xlingsbx.linbackendmaster.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 一键生成测试用户数据
 *
 * <p><b>使用方式（二选一）：</b></p>
 * <ol>
 *   <li><b>命令行参数（推荐）</b>：启动参数加 {@code --gen-mock-users}，只生成数据后正常启动服务</li>
 *   <li><b>临时放开注解</b>：把下面类的 {@code @Component} 和 {@code if} 判断去掉，
 *       启动一次后 <b>务必改回来</b>，否则每次启动都会重复插入</li>
 * </ol>
 *
 * <p>生成的用户密码统一是 {@code 12345678}，登录时账号为 {@code mockuser1} ~ {@code mockuser20}。</p>
 *
 * @author xiaoling
 */
@Component
@Slf4j
public class MockUsers implements CommandLineRunner {

    /**
     * 是否启用。默认关闭，通过启动参数 --gen-mock-users 打开。
     * 如果想直接跑，把这里改成 true 即可。
     */
    private static final boolean ENABLED = false;

    @Resource
    private UserService userService;

    /**
     * 标签池。每类标签代表一个"技术方向"，写在一起的标签相似度高，
     * 这样智能匹配才能算出有区分度的结果。
     */
    private static final String[][] TAG_GROUPS = {
            // Java 后端方向
            {"Java", "后端", "Spring", "MySQL", "Redis", "大厂"},
            // 前端方向
            {"前端", "React", "Vue", "JavaScript", "TypeScript", "大厂"},
            // 算法竞赛方向
            {"算法", "数据结构", "C++", "竞赛", "ACM", "保研"},
            // Python / AI 方向
            {"Python", "人工智能", "机器学习", "数据分析", "读研"},
            // 运维 / 底层方向
            {"Linux", "运维", "Docker", "云计算", "网络"},
            // 移动端方向
            {"Android", "Kotlin", "移动开发", "Flutter"},
            // 考研 / 求职方向
            {"考研", "实习", "校招", "面经", "秋招"},
    };

    private static final String[] USERNAMES = {
            "小明", "小红", "小刚", "小丽", "小强", "小美", "小军", "小芳",
            "小杰", "小燕", "小林", "小雨", "小龙", "小雪", "小鹏", "小婷",
            "小宇", "小雅", "小峰", "小琳",
    };

    /** 需要生成的用户数量 */
    private static final int MOCK_USER_COUNT = 20;

    @Override
    public void run(String... args) {
        if (!ENABLED && !Arrays.asList(args).contains("--gen-mock-users")) {
            return;
        }
        log.info("========== 开始生成测试用户数据 ==========");

        int created = 0;
        int skipped = 0;

        for (int i = 0; i < MOCK_USER_COUNT; i++) {
            String userAccount = "mockuser" + (i + 1);

            // 已存在就跳过，避免重复插入
            if (userService.lambdaQuery().eq(User::getUserAccount, userAccount).count() > 0) {
                skipped++;
                continue;
            }

            try {
                userService.userRegister(
                        userAccount,
                        "12345678",
                        "12345678",
                        String.format("%05d", 20000 + i)
                );
            } catch (Exception e) {
                log.warn("生成用户 {} 失败：{}", userAccount, e.getMessage());
                continue;
            }

            // 注册接口不接收标签，注册完再更新上去
            User user = userService.lambdaQuery().eq(User::getUserAccount, userAccount).one();
            if (user == null) {
                continue;
            }

            User updateUser = new User();
            updateUser.setId(user.getId());
            updateUser.setUsername(USERNAMES[i % USERNAMES.length] + (i + 1));
            // 性别 0-女 1-男
            updateUser.setGender(i % 2);
            updateUser.setTags(buildTagsJson(i));
            userService.updateById(updateUser);

            created++;
        }

        log.info("========== 测试用户生成完成：新增 {} 个，跳过 {} 个 ==========", created, skipped);
        if (created > 0) {
            log.info("登录账号：mockuser1 ~ mockuser{}，密码统一为 12345678", MOCK_USER_COUNT);
        }
    }

    /**
     * 根据序号生成标签 JSON 数组
     * <p>策略：主标签组按序号轮转，再随机附加 1~2 个其他组的标签，
     * 这样用户之间既有相同的方向标签，又有差异，匹配结果更真实。</p>
     */
    private String buildTagsJson(int index) {
        List<String> tags = new ArrayList<>();
        // 主方向：按序号轮转分配到不同的标签组
        String[] mainGroup = TAG_GROUPS[index % TAG_GROUPS.length];
        tags.addAll(Arrays.asList(mainGroup));

        // 附加：从下一个组里挑 1 个标签，制造交叉相似性
        String[] extraGroup = TAG_GROUPS[(index + 1) % TAG_GROUPS.length];
        tags.add(extraGroup[index % extraGroup.length]);

        // 再加一个公共标签，所有人都有，方便测试"部分匹配"
        if (index % 3 == 0) {
            tags.add("实习");
        }

        // 手动拼 JSON，避免引 gson 依赖
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < tags.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append("\"").append(tags.get(i)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}
