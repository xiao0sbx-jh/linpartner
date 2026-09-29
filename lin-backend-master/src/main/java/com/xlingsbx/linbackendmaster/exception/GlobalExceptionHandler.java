package com.xlingsbx.linbackendmaster.exception;

import com.xlingsbx.linbackendmaster.common.BaseResponse;
import com.xlingsbx.linbackendmaster.common.ErrorCode;
import com.xlingsbx.linbackendmaster.common.ResultUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public BaseResponse businessExceptionHandler(BusinessException e) {
        log.error("businessException: " + e.getMessage(), e);
        return ResultUtils.error(e.getCode(), e.getMessage(), e.getDescription());
    }

    @ExceptionHandler(RuntimeException.class)
    public BaseResponse runtimeExceptionHandler(RuntimeException e) {
        log.error("runtimeException", e);
        // 不向前端暴露内部异常细节
        return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "系统内部异常", "");
    }

    /**
     * 兜底处理未被上面捕获的异常，避免前端拿到 Spring 默认错误页
     */
    @ExceptionHandler(Exception.class)
    public BaseResponse exceptionHandler(Exception e) {
        log.error("exception", e);
        return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "系统内部异常", "");
    }
}
