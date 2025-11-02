# Implementation: Article 태그에 # 프리픽스 추가

## 구현 방안

**선택된 방안**: 방안 1 - 직접 수정

### 선택 이유
- 구현이 간단하고 명확
- 추가 함수 호출 오버헤드 없음
- 5개 파일만 수정하면 되는 작은 규모의 변경

## 파일별 수정 내역

### 1. app/[slug]/page.tsx (2곳)

#### 위치 1: Article 헤더 태그 (Line 108-116)
```tsx
// 변경 전
{article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {article.frontmatter.tags.map((tag) => (
      <Badge key={tag} variant="outline">
        {tag}
      </Badge>
    ))}
  </div>
)}

// 변경 후
{article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {article.frontmatter.tags.map((tag) => (
      <Badge key={tag} variant="outline">
        #{tag}
      </Badge>
    ))}
  </div>
)}
```

#### 위치 2: 관련 글 태그 (Line 195-209)
```tsx
// 변경 전
{related.tags && related.tags.length > 0 && (
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {related.tags.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          {tag}
        </Badge>
      ))}
      {related.tags.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{related.tags.length - 3}
        </Badge>
      )}
    </div>
  </CardContent>
)}

// 변경 후
{related.tags && related.tags.length > 0 && (
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {related.tags.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          #{tag}
        </Badge>
      ))}
      {related.tags.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{related.tags.length - 3}
        </Badge>
      )}
    </div>
  </CardContent>
)}
```

### 2. components/home-content.tsx (Line 151-166)

```tsx
// 변경 전
{article.tags && article.tags.length > 0 && (
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {article.tags.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          {tag}
        </Badge>
      ))}
      {article.tags.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{article.tags.length - 3}
        </Badge>
      )}
    </div>
  </CardContent>
)}

// 변경 후
{article.tags && article.tags.length > 0 && (
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {article.tags.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          #{tag}
        </Badge>
      ))}
      {article.tags.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{article.tags.length - 3}
        </Badge>
      )}
    </div>
  </CardContent>
)}
```

### 3. app/series/page.tsx (Line 76-95)

```tsx
// 변경 전
{article.tags && article.tags.length > 0 && (
  <CardContent>
    <div className="flex flex-wrap gap-1">
      {article.tags.slice(0, 2).map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="text-xs"
        >
          {tag}
        </Badge>
      ))}
      {article.tags.length > 2 && (
        <Badge variant="outline" className="text-xs">
          +{article.tags.length - 2}
        </Badge>
      )}
    </div>
  </CardContent>
)}

// 변경 후
{article.tags && article.tags.length > 0 && (
  <CardContent>
    <div className="flex flex-wrap gap-1">
      {article.tags.slice(0, 2).map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="text-xs"
        >
          #{tag}
        </Badge>
      ))}
      {article.tags.length > 2 && (
        <Badge variant="outline" className="text-xs">
          +{article.tags.length - 2}
        </Badge>
      )}
    </div>
  </CardContent>
)}
```

### 4. components/search-dialog.tsx (Line 163-171)

```tsx
// 변경 전
{result.tags && result.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {result.tags.slice(0, 3).map((tag) => (
      <Badge key={tag} variant="outline" className="text-xs">
        {tag}
      </Badge>
    ))}
  </div>
)}

// 변경 후
{result.tags && result.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {result.tags.slice(0, 3).map((tag) => (
      <Badge key={tag} variant="outline" className="text-xs">
        #{tag}
      </Badge>
    ))}
  </div>
)}
```

## 변경 사항 요약

- 총 5개 파일, 5개 위치 수정
- 각 위치에서 `{tag}` → `#{tag}`로 변경
- 스타일링 및 로직 변경 없음
- 원본 데이터 변경 없음 (표시 레이어만 수정)

## 주의사항

- TypeScript 타입 체크 통과 확인
- 빌드 오류 없는지 확인
- 다크 모드에서도 정상 표시 확인
