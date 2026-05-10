# Markdown 写作工具 — 完全覆盖测试文档

> 本文件用于验证编辑器的所有渲染与交互功能。逐节检查即可完成全覆盖。

---

## 一、标题层级（H1–H6）

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

---

## 二、行内样式

- **粗体文本**
- *斜体文本*
- ***粗斜体***
- ~~删除线~~
- `行内代码 const x = 1`
- 普通文本中嵌入 **粗体**、*斜体*、`代码` 混合

---

## 三、链接与图片

- 普通链接：[GitHub](https://github.com)
- 自动链接：https://example.com
- 带标题链接：[Markdown 指南](https://www.markdownguide.org "点击访问")
- 图片：![Alt 占位图](https://via.placeholder.com/200x100.png)

### 粘贴 URL 自动包链接测试

选中下面这段文字，然后粘贴一个 URL，验证是否自动变成链接格式：

这是一段待选中的文本

---

## 四、列表

### 无序列表

- 项目 A
- 项目 B
  - 嵌套 B-1
  - 嵌套 B-2
    - 深层嵌套
- 项目 C

### 有序列表

1. 第一步
2. 第二步
   1. 子步骤 2.1
   2. 子步骤 2.2
3. 第三步

### 自动列表辅助测试

在编辑器中输入 `- ` 后跟空格，验证是否自动进入列表模式。

---

## 五、任务列表（勾选框交互）

- [x] 已完成任务 — 验证渲染为勾选状态
- [ ] 未完成任务 — 点击勾选后验证源码变为 `[x]`
- [ ] 再来一个未完成任务
- [x] 另一个已完成任务

> 测试要点：在预览中点击勾选框，确认源 Markdown 中 `[ ]` 被反写为 `[x]`，反之亦然。

---

## 六、GFM 表格

### 基础表格

| 姓名   | 部门   | 工作内容         |
|--------|--------|------------------|
| 张三   | 前端组 | Vue 3 组件开发   |
| 李四   | 后端组 | API 接口设计     |
| 王五   | 测试组 | 自动化测试脚本   |

### 对齐方式

| 左对齐     | 居中对齐    | 右对齐      |
|:-----------|:-----------:|------------:|
| left       | center      | right       |
| 数据 A     | 数据 B      | 数据 C      |

### 含特殊字符的表格

| 符号   | 转义写法     | 说明              |
|--------|-------------|-------------------|
| `|`    | `\|`        | 管道符需转义       |
| `<`    | `&lt;`      | HTML 实体         |
| `` ` ``| 双反引号包裹 | 行内代码中的反引号 |

---

## 七、代码块语法高亮

### JavaScript

```js
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const save = debounce(() => {
  console.log('文件已保存');
});
```

### Python

```python
from pathlib import Path
from typing import List

def read_markdown_files(folder: Path) -> List[str]:
    """读取文件夹下所有 .md 文件名"""
    return sorted(
        f.name for f in folder.iterdir()
        if f.suffix == '.md' and f.is_file()
    )

if __name__ == '__main__':
    files = read_markdown_files(Path('./docs'))
    for name in files:
        print(f'  - {name}')
```

### Go

```go
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func listMarkdown(dir string) ([]string, error) {
	var files []string
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".md") {
			files = append(files, info.Name())
		}
		return nil
	})
	return files, err
}

func main() {
	files, _ := listMarkdown("./docs")
	for _, f := range files {
		fmt.Println(" -", f)
	}
}
```

### 无语言标记的代码块

```
这是一段没有指定语言的代码块
应该以等宽字体渲染，无高亮
```

---

## 八、引用块

> 单层引用：这是一段引用文本。

> 多段引用：
>
> 第一段内容。
>
> 第二段内容，包含 **粗体** 和 `代码`。

> > 嵌套引用：引用中的引用。

---

## 九、分隔线

以下三种写法都应渲染为水平线：

---

***

___

---

## 十、标题自动辅助测试

在编辑器中新起一行，输入 `# ` 后跟空格，验证：
1. 光标所在行自动识别为标题格式
2. 预览实时更新为对应标题样式

---

## 十一、深浅色主题切换

- [ ] 切换到浅色主题 — 验证背景为白/浅灰，文字为深色
- [ ] 切换到深色主题 — 验证背景为深色，文字为浅色
- [ ] 代码块在两种主题下均有合适的配色
- [ ] 表格边框在两种主题下均可见

---

## 十二、文件操作

### 新建文件
- [ ] 菜单 → 新建：创建空白 `.md` 文件
- [ ] 新建后编辑器清空，标题栏显示"未命名"

### 打开文件
- [ ] 菜单 → 打开：选择本地 `.md` 文件加载到编辑器
- [ ] 内容正确渲染到预览区

### 保存文件
- [ ] 菜单 → 保存：内容写入硬盘 `.md` 文件
- [ ] 未命名文件首次保存弹出"另存为"对话框
- [ ] 已有文件直接覆盖保存

### 最近打开文件
- [ ] 菜单中显示最近 10 条记录
- [ ] 点击记录可直接打开对应文件
- [ ] 超过 10 条时最旧的被移除

---

## 十三、工作区侧边栏

- [ ] 可选择一个文件夹作为工作区
- [ ] 侧边栏列出该文件夹下所有 `.md` 文件（按文件名排序）
- [ ] 点击文件名切换到对应文件
- [ ] 新增/删除 `.md` 文件后列表自动刷新

---

## 十四、未保存提醒

- [ ] 编辑内容后关闭窗口 → 弹出"是否保存"提醒
- [ ] 选择"保存"→ 保存后关闭
- [ ] 选择"不保存"→ 直接关闭
- [ ] 选择"取消"→ 留在编辑器

---

## 十五、边界与异常

### 空文件
（此处为空，验证空文件能正常打开和保存）

### 超长单行

这是一段非常长的文本用于测试编辑器和预览区的横向滚动或自动换行行为AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA结束

### 特殊字符

< > & " ' \ / | ~ ^ { } [ ] ( ) # + - . ! @ $ % * _ =

### HTML 标签（应转义或忽略）

<script>alert('xss')</script>
<div style="color:red">不应渲染为红色</div>

### 连续空行



（上方有三个连续空行，验证不会崩溃）

---

## 十六、综合周报示例

### 本周工作总结 — 2024-W03

| 事项           | 状态   | 备注                     |
|----------------|--------|--------------------------|
| 需求评审       | ✅ 完成 | 与产品对齐了 3 个需求     |
| 接口联调       | 🔄 进行中 | 预计下周二完成         |
| Bug 修复       | ✅ 完成 | 共修复 5 个 P1 缺陷      |
| 单元测试补充   | ❌ 未开始 | 排到下周               |

#### 下周计划

1. 完成接口联调
2. 补充单元测试覆盖率到 80%
3. 准备技术分享材料

#### 风险与阻塞

> 第三方服务偶发超时，已提工单跟进。

---

*— 测试文档结束 —*
