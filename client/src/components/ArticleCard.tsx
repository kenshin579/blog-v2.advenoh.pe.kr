import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ArticleFrontmatter } from "@/lib/markdown";
import defaultImage from "@assets/generated_images/Default_IT_blog_image_a1b48a45.png";

interface ArticleCardProps {
  slug: string;
  frontmatter: ArticleFrontmatter;
  readingTime: number;
  firstImage?: string;
}

export function ArticleCard({ slug, frontmatter, readingTime, firstImage }: ArticleCardProps) {
  const imageUrl = firstImage || defaultImage;

  return (
    <Link href={`/article/${slug}`}>
      <div data-testid={`article-card-${slug}`} className="cursor-pointer">
        <Card className="h-full hover-elevate transition-colors overflow-hidden">
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={frontmatter.title}
              className="w-full h-full object-cover"
              data-testid={`article-image-${slug}`}
            />
          </div>

          <CardHeader className="space-y-0 pb-4">
            <h2 className="text-xl font-semibold line-clamp-2 mb-3">
              {frontmatter.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={frontmatter.date} data-testid={`text-date-${slug}`}>
                {new Date(frontmatter.date).toLocaleDateString('ko-KR')}
              </time>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime}분
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {frontmatter.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {frontmatter.excerpt}
              </p>
            )}

            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {frontmatter.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" data-testid={`tag-${tag}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Link>
  );
}
